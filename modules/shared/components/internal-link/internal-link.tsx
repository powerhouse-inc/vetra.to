import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/utils'
import type { Route } from 'next'

interface InternalLinkProps {
  href: Route
  children?: React.ReactNode
  className?: string
}

export function InternalLink({ href, children, className }: InternalLinkProps) {
  return (
    <Button
      variant="secondary"
      asChild
      className={cn(
        'group shadow-none transition-all duration-200 ease-in-out hover:gap-4 hover:pr-2',
        className,
      )}
    >
      <Link href={href}>
        {children && <span className="text-base font-medium">{children}</span>}

        <div className="flex items-center">
          <ArrowRight className="h-5 w-5" />
        </div>
      </Link>
    </Button>
  )
}
