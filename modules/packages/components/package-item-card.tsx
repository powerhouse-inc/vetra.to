import { FileText, Database, Code2, FileCode, Layers } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import {
  StripedCard,
  StripedCardContent,
  StripedCardHeader,
  StripedCardTitle,
} from '@/modules/shared/components/striped-card/striped-card'
import { cn } from '@/modules/shared/lib/utils'

export interface PackageItemCardProps {
  name: string
  description?: string | null
  category?: string | null
  authorName?: string | null
  documentId: string
  className?: string
}

// Map category to icon and color
function getCategoryIcon(category?: string | null) {
  const cat = category?.toLowerCase() || ''

  if (cat.includes('processor')) {
    return { Icon: Database, className: 'text-blue-600' }
  }
  if (cat.includes('subgraph')) {
    return { Icon: Layers, className: 'text-purple-600' }
  }
  if (cat.includes('codegen') || cat.includes('application')) {
    return { Icon: Code2, className: 'text-orange-600' }
  }
  if (cat.includes('editor')) {
    return { Icon: FileCode, className: 'text-blue-500' }
  }

  return { Icon: FileText, className: 'text-orange-500' }
}

export function PackageItemCard({
  name,
  description,
  category,
  authorName,
  documentId,
  className,
}: PackageItemCardProps) {
  const { Icon, className: iconClassName } = getCategoryIcon(category)

  return (
    <Link href={`/packages/${documentId}`}>
      <StripedCard className={cn('group cursor-pointer transition-all hover:shadow-md', className)}>
        <StripedCardHeader>
          <StripedCardTitle className="text-center">{name}</StripedCardTitle>
        </StripedCardHeader>
        <StripedCardContent className="flex flex-col gap-4">
          {/* Icon */}
          <div className="flex h-16 items-center justify-center">
            <div className="rounded-lg bg-orange-50 p-4">
              <Icon className={cn('h-8 w-8', iconClassName)} />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1">
            <p className="text-center text-sm font-medium">{category || 'Document Model'}</p>

            {/* Author */}
            {authorName && (
              <div className="text-muted-foreground flex items-center justify-center gap-1.5 text-xs">
                <span className="inline-flex items-center gap-1">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z" />
                  </svg>
                  Contributor Billing by {authorName}
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          {description && (
            <p className="text-muted-foreground line-clamp-3 text-center text-xs leading-relaxed">
              {description}
            </p>
          )}
        </StripedCardContent>
      </StripedCard>
    </Link>
  )
}
