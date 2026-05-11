'use client'

import { Check, ChevronDown, Copy, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { loadEnvironmentController } from '@/modules/cloud/controller'
import { useCanSign } from '@/modules/cloud/hooks/use-can-sign'
import type { CloudEnvironment } from '@/modules/cloud/types'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/modules/shared/components/ui/alert-dialog'
import { Button } from '@/modules/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/modules/shared/components/ui/dialog'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  environment: CloudEnvironment
  /** Only passed when the env is in a status that supports termination. */
  onTerminate?: () => Promise<void>
}

const TERMINAL_STATUSES = new Set(['DRAFT', 'TERMINATING', 'DESTROYED', 'ARCHIVED'])

/**
 * Modal triggered by the info icon in the env hero. Holds the rarely-needed
 * admin surfaces — diagnostic metadata and the destructive Terminate / Delete
 * actions — so the main page stays focused on services and packages.
 */
export function EnvMetadataDialog({ open, onOpenChange, environment, onTerminate }: Props) {
  const status = environment.state.status
  const displayName = environment.state.label || environment.name
  const canTerminate = !!onTerminate && !TERMINAL_STATUSES.has(status)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Environment details</DialogTitle>
          <DialogDescription>Document metadata and destructive actions.</DialogDescription>
        </DialogHeader>

        <dl className="grid grid-cols-[7rem_1fr] gap-x-4 gap-y-3 text-sm">
          <MetadataField label="Document ID" value={environment.id} mono copyable />
          <MetadataField label="Type" value={environment.documentType} />
          <MetadataField label="Revision" value={String(environment.revision)} />
          <MetadataField
            label="Created"
            value={
              environment.createdAtUtcIso
                ? new Date(environment.createdAtUtcIso).toLocaleString()
                : '—'
            }
          />
          <MetadataField
            label="Modified"
            value={
              environment.lastModifiedAtUtcIso
                ? new Date(environment.lastModifiedAtUtcIso).toLocaleString()
                : '—'
            }
          />
        </dl>

        {(canTerminate || !TERMINAL_STATUSES.has(status)) && (
          <DangerZone
            displayName={displayName}
            environment={environment}
            canTerminate={canTerminate}
            onTerminate={onTerminate}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function MetadataField({
  label,
  value,
  mono,
  copyable,
}: {
  label: string
  value: string
  mono?: boolean
  copyable?: boolean
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      toast.error('Failed to copy')
    }
  }

  return (
    <>
      <dt className="text-muted-foreground text-xs font-medium">{label}</dt>
      <dd
        className={
          mono
            ? 'flex items-center gap-1.5 font-mono text-xs break-all'
            : 'flex items-center gap-1.5 text-sm'
        }
      >
        <span className="min-w-0 flex-1 truncate">{value}</span>
        {copyable && (
          <button
            type="button"
            onClick={handleCopy}
            className="text-muted-foreground hover:text-foreground shrink-0"
            aria-label={`Copy ${label}`}
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          </button>
        )}
      </dd>
    </>
  )
}

function DangerZone({
  displayName,
  environment,
  canTerminate,
  onTerminate,
  onClose,
}: {
  displayName: string
  environment: CloudEnvironment
  canTerminate: boolean
  onTerminate?: () => Promise<void>
  onClose: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const { signer } = useCanSign()

  const handleDelete = async () => {
    if (!signer) {
      toast.error('You must be logged in with Renown to delete an environment')
      return
    }
    try {
      setIsDeleting(true)
      const ctrl = await loadEnvironmentController({ documentId: environment.id, signer })
      await ctrl.delete()
      toast.success('Environment deleted')
      onClose()
      router.push('/cloud')
    } catch (error) {
      console.error('Failed to delete environment:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete environment')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="border-destructive/30 mt-2 rounded-md border">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="text-destructive hover:bg-destructive/5 flex w-full items-center justify-between px-3 py-2 text-sm font-medium transition-colors"
        aria-expanded={expanded}
      >
        <span className="flex items-center gap-2">
          <Trash2 className="h-3.5 w-3.5" />
          Danger zone
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && (
        <div className="space-y-3 px-3 pb-3 text-sm">
          {canTerminate && (
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <p className="font-medium">Terminate</p>
                <p className="text-muted-foreground text-xs">
                  Stop all services and begin teardown.
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={async () => {
                  await onTerminate?.()
                  onClose()
                }}
              >
                Terminate
              </Button>
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <p className="font-medium">Delete</p>
              <p className="text-muted-foreground text-xs">
                Permanently remove this environment. Cannot be undone.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isDeleting}>
                  {isDeleting ? 'Deleting…' : 'Delete'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete environment</AlertDialogTitle>
                  <AlertDialogDescription>
                    Delete &ldquo;{displayName}&rdquo;? This action cannot be undone and all data
                    will be permanently lost.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}
    </div>
  )
}
