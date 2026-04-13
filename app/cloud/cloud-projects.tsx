'use client'

import { Trash2, Server, Package } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

import { loadEnvironmentController } from '@/modules/cloud/controller'
import { useCanSign } from '@/modules/cloud/hooks/use-can-sign'
import {
  useEnvironments,
  useRefreshEnvironments,
  useViewer,
} from '@/modules/cloud/hooks/use-environment'
import type { ListScope } from '@/modules/cloud/graphql'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/modules/shared/components/ui/alert-dialog'
import { Button } from '@/modules/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/modules/shared/components/ui/card'

import type { CloudEnvironment } from './types'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Draft', color: 'bg-muted-foreground' },
  CHANGES_PENDING: { label: 'Pending', color: 'bg-blue-500' },
  CHANGES_APPROVED: { label: 'Approved', color: 'bg-blue-500' },
  CHANGES_PUSHED: { label: 'Deploying', color: 'bg-warning' },
  DEPLOYING: { label: 'Deploying', color: 'bg-warning' },
  DEPLOYMENt_FAILED: { label: 'Failed', color: 'bg-destructive' },
  READY: { label: 'Ready', color: 'bg-success' },
  TERMINATING: { label: 'Terminating', color: 'bg-destructive' },
  DESTROYED: { label: 'Destroyed', color: 'bg-muted-foreground' },
  ARCHIVED: { label: 'Archived', color: 'bg-muted-foreground' },
  STOPPED: { label: 'Stopped', color: 'bg-muted-foreground' },
}

function StatusDot({ status }: { status: string }) {
  const config = STATUS_LABELS[status] ?? { label: status, color: 'bg-muted-foreground' }

  return (
    <span className="flex items-center gap-1.5 text-xs font-medium">
      <span className={`inline-block h-2 w-2 rounded-full ${config.color}`} />
      {config.label}
    </span>
  )
}

function CloudEnvironmentCard({ env }: { env: CloudEnvironment }) {
  const { signer, canSign } = useCanSign()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const refreshEnvironments = useRefreshEnvironments()
  const displayName = env.state.label || env.name || 'Unnamed'
  const packageCount = env.state.packages.length

  const handleDelete = async () => {
    if (!signer) {
      toast.error('You must be logged in with Renown to delete an environment')
      return
    }
    try {
      setIsDeleting(true)
      const ctrl = await loadEnvironmentController({ documentId: env.id, signer })
      await ctrl.delete()
      toast.success('Environment deleted successfully')
      refreshEnvironments()
      setShowDeleteDialog(false)
    } catch (error) {
      console.error('Failed to delete environment:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete environment')
    } finally {
      setIsDeleting(false)
    }
  }

  const enabledServices = env.state.services.filter((s) => s.enabled)

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Server className="h-4 w-4" />
          {displayName}
        </CardTitle>
        <StatusDot status={env.state.status} />
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="flex items-center gap-4 text-sm">
          <div className="text-muted-foreground flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5" />
            {packageCount} package{packageCount !== 1 ? 's' : ''}
          </div>
          {enabledServices.length > 0 && (
            <div className="text-muted-foreground text-xs">
              {enabledServices.map((s) => s.type).join(', ')}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="default" asChild className="flex-1">
            <Link href={`/cloud/${env.id}`}>Open</Link>
          </Button>
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <Button
              variant="outline"
              size="icon"
              className="text-muted-foreground hover:text-destructive hover:border-destructive shrink-0"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isDeleting || !canSign}
              title={canSign ? 'Delete environment' : 'Log in with Renown to delete'}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete environment?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete &quot;{displayName}&quot;. This action cannot be
                  undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  )
}

export function CloudEnvironments() {
  const [scope, setScope] = useState<ListScope>('MINE')
  const { viewer } = useViewer()
  const environments = useEnvironments(scope)
  const isAdmin = viewer?.isAdmin ?? false

  return (
    <div className="space-y-4">
      {/* Admin-only Mine | All toggle */}
      {isAdmin && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">View:</span>
          <div className="bg-muted inline-flex rounded-md p-0.5">
            <button
              type="button"
              onClick={() => setScope('MINE')}
              className={`rounded px-3 py-1 transition-colors ${
                scope === 'MINE'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Mine
            </button>
            <button
              type="button"
              onClick={() => setScope('ALL')}
              className={`rounded px-3 py-1 transition-colors ${
                scope === 'ALL'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All
            </button>
          </div>
        </div>
      )}

      {environments.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center space-y-4 py-12">
          <Server className="text-muted-foreground h-12 w-12" />
          <div className="text-center">
            <h3 className="text-lg font-semibold">No environments yet</h3>
            <p className="text-muted-foreground text-sm">
              {scope === 'ALL'
                ? 'No environments exist in the system.'
                : 'Create your first environment to get started.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {environments.map((env) => (
            <CloudEnvironmentCard key={env.id} env={env} />
          ))}
        </div>
      )}
    </div>
  )
}
