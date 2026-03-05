'use client'

import { useState } from 'react'
import { NewProjectForm } from '@/app/cloud/new-project-form'
import { Button } from '@/modules/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/modules/shared/components/ui/dialog'
import { Plus } from 'lucide-react'
import { useRefreshProjects } from './use-cloud-data'

export function NewProjectModalButton() {
  const [open, setOpen] = useState(false)
  const refreshProjects = useRefreshProjects()

  const handleSuccess = () => {
    setOpen(false)
    refreshProjects()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create new project</DialogTitle>
        </DialogHeader>
        <NewProjectForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  )
}
