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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Source</h2>
        {repoUrl && (
          <Button variant="outline" size="sm" asChild>
            <a href={repoUrl} target="_blank" rel="noopener noreferrer" className="gap-2">
              <Github className="size-4" />
              Browse on GitHub
              <ExternalLink className="size-3" />
            </a>
          </Button>
        )}
      </div>

      {/* File tabs */}
      <div className="flex gap-1 border-b">
        {files.map((file) => (
          <button
            key={file.name}
            onClick={() => setActiveFile(file.name)}
            className={cn(
              'flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition-colors',
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
        <div className="overflow-hidden rounded-lg border">
          <div className="bg-accent/50 flex items-center justify-between border-b px-4 py-2">
            <span className="text-muted-foreground text-xs font-medium">{active.path}</span>
          </div>
          <pre className="max-h-[500px] overflow-auto p-4 text-xs leading-relaxed">
            <code>{active.content}</code>
          </pre>
        </div>
      )}
    </div>
  )
}
