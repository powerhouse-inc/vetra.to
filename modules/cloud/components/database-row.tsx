'use client'

import { ChevronRight, Database } from 'lucide-react'

type Props = {
  clusterName: string
  onOpen: () => void
}

export function DatabaseRow({ clusterName, onOpen }: Props) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="bg-background/40 hover:bg-background/60 group flex w-full items-center gap-3 rounded-lg p-4 text-left transition-colors"
    >
      <div className="bg-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-md">
        <Database className="text-muted-foreground h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">Database</span>
          <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium tracking-wide text-emerald-400">
            healthy
          </span>
        </div>
        <p className="text-muted-foreground mt-0.5 truncate font-mono text-xs">
          {clusterName} · postgres 16
        </p>
      </div>
      <ChevronRight className="text-muted-foreground group-hover:text-foreground h-4 w-4 shrink-0 transition-colors" />
    </button>
  )
}
