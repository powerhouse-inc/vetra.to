'use client'

import { Check, Copy, PackagePlus, Terminal } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/modules/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/modules/shared/components/ui/dialog'

const steps = [
  {
    title: 'Install Powerhouse CLI',
    description: 'Install the Powerhouse command-line tool globally.',
    command: 'npm install -g ph-cmd',
  },
  {
    title: 'Initialize your package',
    description: 'Create a new package project with the Powerhouse scaffolding.',
    command: 'ph init my-package',
  },
  {
    title: 'Start the development server',
    description: 'Launch the local development environment to build and test your document models and editors.',
    command: 'ph vetra',
  },
  {
    title: 'Build your package',
    description: 'Compile your document models, editors, and other modules for distribution.',
    command: 'ph build',
  },
  {
    title: 'Publish to registry',
    description: 'Publish your package to the Vetra package registry so others can install it.',
    command: 'ph publish',
  },
]

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
    >
      {copied ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
    </button>
  )
}

export function CreatePackageModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <PackagePlus className="size-4" />
          Create your own Package
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackagePlus className="size-5 text-primary" />
            Create a Package
          </DialogTitle>
          <DialogDescription>
            Build and publish your own document models, editors, and modules to the Vetra ecosystem.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-1">
          {steps.map((step, i) => (
            <div key={step.title} className="relative flex gap-4 pb-6 last:pb-0">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="absolute left-[15px] top-8 h-[calc(100%-16px)] w-px bg-border" />
              )}

              {/* Step number */}
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {i + 1}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1 space-y-2 pt-0.5">
                <h3 className="text-sm font-semibold">{step.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
                <div className="flex items-center gap-2 rounded-md bg-accent/50 border px-3 py-2 font-mono text-xs">
                  <Terminal className="size-3 shrink-0 text-muted-foreground" />
                  <code className="flex-1 truncate">{step.command}</code>
                  <CopyButton text={step.command} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Need more details? Check the{' '}
            <a
              href="https://academy.vetra.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-medium hover:underline"
            >
              Powerhouse Academy
            </a>
            {' '}for comprehensive guides on building document models and editors.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
