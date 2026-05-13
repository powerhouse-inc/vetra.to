'use client'
import { Package, ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/modules/shared/components/ui/card'
import { Button } from '@/modules/shared/components/ui/button'

export function PackagesTab() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
        <div className="bg-muted flex size-12 items-center justify-center rounded-full">
          <Package className="text-muted-foreground size-6" />
        </div>
        <div className="max-w-md">
          <h3 className="text-base font-semibold">Your packages will appear here soon</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Once Renown-based registry authentication lands, packages you publish via{' '}
            <code className="bg-muted rounded px-1 py-0.5 text-xs">ph publish</code> will be listed
            here.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a
            href="https://github.com/powerhouse-inc/powerhouse/pull/2576"
            target="_blank"
            rel="noopener noreferrer"
          >
            Track PR #2576
            <ExternalLink className="ml-1.5 size-3.5" />
          </a>
        </Button>
      </CardContent>
    </Card>
  )
}
