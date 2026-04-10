'use client'

import { Check, Copy } from 'lucide-react'
import { useState } from 'react'

export function CopyCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(command)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-accent/50 flex items-center gap-2 rounded-lg border px-4 py-3 font-mono text-sm">
      <span className="text-muted-foreground select-none">$</span>
      <code className="flex-1 truncate">{command}</code>
      <button
        onClick={() => void copy()}
        className="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
      >
        {copied ? <Check className="text-primary size-4" /> : <Copy className="size-4" />}
      </button>
    </div>
  )
}
