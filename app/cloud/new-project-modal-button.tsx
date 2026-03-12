'use client'

import { Plus } from 'lucide-react'
import { useState } from 'react'

import { NewEnvironmentForm } from '@/app/cloud/new-project-form'
import { useRefreshEnvironments } from '@/modules/cloud/hooks/use-environment'
import { Button } from '@/modules/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/modules/shared/components/ui/dialog'

export function NewEnvironmentModalButton() {
  const [open, setOpen] = useState(false)
  const refreshEnvironments = useRefreshEnvironments()

  const handleSuccess = () => {
    setOpen(false)
    refreshEnvironments()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Environment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create new environment</DialogTitle>
        </DialogHeader>
        <NewEnvironmentForm onCreated={() => handleSuccess()} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  )
}
