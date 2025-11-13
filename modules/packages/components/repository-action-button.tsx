'use client'

import { Check, ChevronDown, Copy, ExternalLink, Github } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/modules/shared/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shared/components/ui/popover'

interface RepositoryActionButtonProps {
  githubUrl?: string | null
  driveId?: string | null
  packageName?: string | null
}

export function RepositoryActionButton({
  githubUrl,
  driveId,
  packageName,
}: RepositoryActionButtonProps) {
  const [open, setOpen] = useState(false)
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null)
  const hasGithubUrl = !!githubUrl

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedCommand(text)
      setTimeout(() => setCopiedCommand(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Generate the drive URL
  const driveUrl = driveId
    ? `https://switchboard.staging.vetra.io/d/${driveId}`
    : 'https://switchboard.staging.vetra.io/d/61fff014-ff45-4270-aa16-5ca75429cc55'

  // Generate the ph init command with package name
  const phInitCommand = packageName
    ? `ph init ${packageName} --remote-drive ${driveUrl}`
    : `ph init <package-name> --remote-drive ${driveUrl}`

  // Generate the ph checkout command with remote drive
  const phCheckoutCommand = githubUrl ? `ph checkout --remote-drive ${driveUrl} ${githubUrl}` : ''

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="flex p-1 py-5">
          <div className="flex items-center gap-2">
            <div className="bg-muted flex h-8 w-8 items-center justify-center rounded">
              <Github className="h-5 w-5" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-xs font-medium tracking-wide uppercase">
                {hasGithubUrl ? 'Explore Repository' : 'Create Repository'}
              </span>
              <span className="text-sm font-bold">On Github</span>
            </div>
            <ChevronDown className="ml-1 h-4 w-4" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[500px] p-0" align="start">
        <div className="bg-card rounded-lg p-4">
          <div className="text-muted-foreground mb-2 text-xs font-medium tracking-wider uppercase">
            Edit-in-connect
          </div>

          {hasGithubUrl ? (
            // Explore Repository Content
            <div className="space-y-4">
              {/* Git Clone Command */}
              <div className="bg-muted/50 space-y-2 rounded-lg p-4">
                <div className="flex items-start justify-between gap-2">
                  <code className="flex-1 font-mono text-sm break-all">git clone {githubUrl}</code>
                  <div className="flex flex-shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => copyToClipboard(`git clone ${githubUrl}`)}
                    >
                      {copiedCommand === `git clone ${githubUrl}` ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                      <a href={githubUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
                <p className="text-muted-foreground text-xs">Clone using the web URL.</p>
              </div>

              {/* Ph Checkout Command */}
              <div className="bg-muted/50 space-y-2 rounded-lg p-4">
                <div className="flex items-start justify-between gap-2">
                  <code className="flex-1 font-mono text-sm break-all">{phCheckoutCommand}</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    onClick={() => copyToClipboard(phCheckoutCommand)}
                  >
                    {copiedCommand === phCheckoutCommand ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-muted-foreground text-xs">
                  Clone the repository & connect to the Vetra Drive
                </p>
              </div>
            </div>
          ) : (
            // Create Repository Content
            <div className="bg-muted/50 space-y-2 rounded-lg p-4">
              <div className="flex items-start justify-between gap-2">
                <code className="flex-1 font-mono text-sm break-all">{phInitCommand}</code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                  onClick={() => copyToClipboard(phInitCommand)}
                >
                  {copiedCommand === phInitCommand ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-muted-foreground text-xs">
                Initialize a repository & connect to the Vetra Drive
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
