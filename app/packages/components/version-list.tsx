'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Tag } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/modules/shared/components/ui/badge'
import { Button } from '@/modules/shared/components/ui/button'

interface VersionListProps {
  versions: string[]
  distTags: Record<string, string>
  timestamps: Record<string, string>
  packageName: string
  registryUrl: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days}d ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

export function VersionList({ versions, distTags, timestamps, packageName }: VersionListProps) {
  const [showAll, setShowAll] = useState(false)
  const tagMap = new Map<string, string[]>()
  for (const [tag, version] of Object.entries(distTags)) {
    const existing = tagMap.get(version) ?? []
    existing.push(tag)
    tagMap.set(version, existing)
  }

  const stableVersions = versions.filter((v) => !v.includes('-'))
  const displayVersions = showAll ? versions : stableVersions.slice(0, 10)
  const packagePath = `/packages/${encodeURIComponent(packageName)}`

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Versions
          <span className="text-muted-foreground ml-1.5 text-sm font-normal">
            ({stableVersions.length} stable, {versions.length} total)
          </span>
        </h2>
      </div>

      {/* Dist tags */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(distTags).map(([tag, version]) => (
          <Link
            key={tag}
            href={`${packagePath}?v=${version}`}
            className="hover:border-primary hover:bg-primary/5 flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors"
          >
            <Tag className="text-primary size-3" />
            <span className="font-semibold">{tag}</span>
            <span className="text-muted-foreground">{version}</span>
          </Link>
        ))}
      </div>

      {/* Version list */}
      <div className="divide-y rounded-lg border">
        {displayVersions.map((version) => {
          const tags = tagMap.get(version)
          const time = timestamps[version]
          return (
            <Link
              key={version}
              href={`${packagePath}?v=${version}`}
              className="hover:bg-accent/30 flex items-center justify-between px-4 py-2.5 text-sm transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="hover:text-primary font-mono">{version}</span>
                {tags?.map((tag) => (
                  <Badge
                    key={tag}
                    variant={tag === 'latest' ? 'default' : 'secondary'}
                    className="text-[10px]"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
              {time && (
                <span className="text-muted-foreground text-xs" title={formatDate(time)}>
                  {timeAgo(time)}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {(showAll
        ? versions.length > 10
        : stableVersions.length > 10 || versions.length > stableVersions.length) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAll(!showAll)}
          className="w-full gap-1 text-xs"
        >
          {showAll ? (
            <>
              Show less <ChevronUp className="size-3" />
            </>
          ) : (
            <>
              Show all {versions.length} versions <ChevronDown className="size-3" />
            </>
          )}
        </Button>
      )}
    </div>
  )
}
