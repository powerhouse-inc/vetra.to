'use client'

import { useState } from 'react'
import { Button } from '@/modules/shared/components/ui/button'
import { FolderOpen, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
} from '@/modules/shared/components/ui/card'
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

import { useProjects, useRefreshProjects } from './use-cloud-data'
import { deleteProjectDocument } from './lib/api'

type CloudProjectCardProps = {
  id: string
  title: string
  description: string
}

function CloudProjectCard({ id, title, description }: CloudProjectCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const refreshProjects = useRefreshProjects()

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await deleteProjectDocument({ docId: id })
      toast.success('Project deleted successfully')
      refreshProjects()
      setShowDeleteDialog(false)
    } catch (error) {
      console.error('Failed to delete project:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete project')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="p-2">
      <Card style={{ width: 320 }} className="relative">
        <CardHeader className="pr-12">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive absolute top-2 right-2 h-8 w-8"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete &quot;{title}&quot;. This action cannot be undone.
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
        <CardFooter className="flex flex-col gap-2">
          <Button variant="default" asChild className="w-full">
            <Link href={`/cloud/${id}`} className="flex items-center justify-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Open project
            </Link>
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link
              href={`/cloud/new/server/${id}`}
              className="flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Environment
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export function CloudProjects() {
  const projects = useProjects()

  return (
    <div className="flex flex-wrap">
      {projects.map((project) => (
        <CloudProjectCard
          key={project.id}
          id={project.id}
          title={project.title}
          description={project.description}
        />
      ))}
    </div>
  )
}
