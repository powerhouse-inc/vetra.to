'use client'

import { useState } from 'react'
import { ExternalLink, FileJson, Github } from 'lucide-react'
import { Button } from '@/modules/shared/components/ui/button'
import { cn } from '@/modules/shared/lib/utils'

interface SourceFile {
  name: string
  path: string
  content: string
}

interface SourceViewerProps {
  files: SourceFile[]
  repoUrl?: string
}

export function SourceViewer({ files, repoUrl }: SourceViewerProps) {
  const [activeFile, setActiveFile] = useState(files[0]?.name)
  const active = files.find((f) => f.name === activeFile) ?? files[0]

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Source</h2>
        {repoUrl && (
          <Button variant="outline" size="sm" asChild>
            <a href={repoUrl} target="_blank" rel="noopener noreferrer" className="gap-2">
              <Github className="size-4" />
              <span className="hidden sm:inline">Browse on GitHub</span>
              <span className="sm:hidden">GitHub</span>
              <ExternalLink className="size-3" />
            </a>
          </Button>
        )}
      </div>

      {/* File tabs */}
      <div className="flex gap-1 overflow-x-auto border-b">
        {files.map((file) => (
          <button
            key={file.name}
            onClick={() => setActiveFile(file.name)}
            className={cn(
              'flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors',
              activeFile === file.name
                ? 'border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground border-transparent',
            )}
          >
            <FileJson className="size-3.5" />
            {file.name}
          </button>
        ))}
      </div>

      {/* File content */}
      {active && (
        <div className="w-full overflow-hidden rounded-lg border">
          <div className="bg-accent/50 flex items-center border-b px-4 py-2">
            <span className="text-muted-foreground truncate text-xs font-medium">
              {active.path}
            </span>
          </div>
          <div className="overflow-x-auto">
            <pre className="max-h-[400px] overflow-y-auto p-4 text-xs leading-relaxed">
              <code>{active.content}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
