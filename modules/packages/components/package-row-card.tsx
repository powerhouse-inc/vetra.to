'use client'

import { ArrowLeft } from 'lucide-react'
import React from 'react'

import { cn } from '@/modules/shared/lib/utils'
import ConnectIcon from '@/modules/shared/components/svgs/connect.svg'
import ArrowBackIcon from '@/modules/packages/assets/arrow-back.svg'
import PackageIcon from '@/modules/packages/assets/package-icon.svg'

export interface PackageRowCardProps {
  packageName: string
  publisherName: string
  description: string
  driveName?: string
  onBack?: () => void
  onPublisherClick?: () => void
  onOpenInConnect?: () => void
  className?: string
}

export function PackageRowCard({
  packageName,
  publisherName,
  description,
  driveName = 'Vetra Studio Drive',
  onBack,
  onPublisherClick,
  onOpenInConnect,
  className,
}: PackageRowCardProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-xl bg-white py-3 pr-4 pl-3.5 shadow-md',
        className,
      )}
    >
      {/* Left section */}
      <div className="flex items-center gap-4">
        {/* Back button */}
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md border border-border bg-white"
        >
          <ArrowLeft className="h-4 w-4 text-black" />
        </button>

        {/* Text content */}
        <div className="flex flex-col">
          {/* Title line */}
          <div className="flex items-center gap-[7px]">
            <PackageIcon className="h-[13px] w-3 shrink-0 text-foreground" />
            <span className="text-sm leading-6 text-foreground">
              <span className="font-semibold">{packageName}</span>
              {' '}
              <span className="font-normal">by</span>
              {' '}
              <button
                type="button"
                onClick={onPublisherClick}
                className="cursor-pointer font-semibold text-[#504dff] hover:underline"
              >
                {publisherName}
              </button>
            </span>
            <button
              type="button"
              onClick={onPublisherClick}
              className="cursor-pointer"
            >
              <ArrowBackIcon className="h-4 w-4 shrink-0" />
            </button>
          </div>

          {/* Description */}
          <p className="line-clamp-1 text-xs leading-[18px] font-medium text-muted-foreground">
            {description}
          </p>
        </div>
      </div>

      {/* Right section - Open in Connect button */}
      <button
        type="button"
        onClick={onOpenInConnect}
        className="flex h-9 w-[135px] shrink-0 cursor-pointer items-center rounded-md border border-foreground bg-white"
      >
        <ConnectIcon className="ml-1 mr-0.5 h-7 w-7 shrink-0 text-foreground" />
        <div className="flex flex-col items-start justify-center">
          <span className="text-[8px] leading-3.5 font-medium uppercase text-foreground">
            Open in Connect
          </span>
          <span className="text-[9px] leading-3.5 font-semibold text-foreground">
            {driveName}
          </span>
        </div>
      </button>
    </div>
  )
}
