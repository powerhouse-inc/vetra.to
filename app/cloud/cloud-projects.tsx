'use client'

import { Trash2, Server, Package, Activity } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

import { deleteDocument } from '@/modules/cloud/api'
import { useEnvironments, useRefreshEnvironments } from '@/modules/cloud/hooks/use-environment'
import {
  StripedCard,
  StripedCardContent,
  StripedCardHeader,
  StripedCardTitle,
} from '@/modules/shared/components/striped-card'
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
import { Badge } from '@/modules/shared/components/ui/badge'
import { Button } from '@/modules/shared/components/ui/button'

import type { CloudEnvironment } from './types'

function StatusBadge({ status }: { status: string }) {
  const isRunning = status === 'STARTED'
  return (
    <Badge variant={isRunning ? 'default' : 'secondary'}>
      <Activity className="h-3 w-3" />
      {status}
    </Badge>
  )
}

function CloudEnvironmentCard({ env }: { env: CloudEnvironment }) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const refreshEnvironments = useRefreshEnvironments()
  const displayName = env.state.name || env.name || 'Unnamed'
  const packageCount = env.state.packages?.length ?? 0

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await deleteDocument(env.id)
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

  return (
    <StripedCard className="w-full transition-shadow hover:shadow-md sm:w-[340px]">
      <StripedCardHeader className="flex-row items-center justify-between">
        <StripedCardTitle className="flex items-center gap-2">
          <Server className="h-4 w-4" />
          {displayName}
        </StripedCardTitle>
        <StatusBadge status={env.state.status} />
      </StripedCardHeader>
      <StripedCardContent className="space-y-4 p-4">
        <div className="flex items-center gap-4 text-sm">
          <div className="text-muted-foreground flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5" />
            {packageCount} package{packageCount !== 1 ? 's' : ''}
          </div>
          {env.state.services.length > 0 && (
            <div className="text-muted-foreground text-xs">{env.state.services.join(', ')}</div>
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
              disabled={isDeleting}
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
      </StripedCardContent>
    </StripedCard>
  )
}

export function CloudEnvironments() {
  const environments = useEnvironments()

  if (environments.length === 0) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center space-y-4 py-12">
        <Server className="text-muted-foreground h-12 w-12" />
        <div className="text-center">
          <h3 className="text-lg font-semibold">No environments yet</h3>
          <p className="text-muted-foreground text-sm">
            Create your first environment to get started.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-4">
      {environments.map((env) => (
        <CloudEnvironmentCard key={env.id} env={env} />
      ))}
    </div>
  )
}
