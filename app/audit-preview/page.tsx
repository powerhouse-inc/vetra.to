'use client'

import { useState } from 'react'
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
import { Card, CardContent } from '@/modules/shared/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/modules/shared/components/ui/dialog'
import { Input } from '@/modules/shared/components/ui/input'
import { Label } from '@/modules/shared/components/ui/label'

export default function Audit() {
  const [alertOpen, setAlertOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <main className="bg-background min-h-screen space-y-12 p-12">
      <h1 className="text-3xl font-bold">Audit preview</h1>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Triggers</h2>
        <div className="flex gap-2">
          <Button onClick={() => setAlertOpen(true)} variant="destructive">
            Open AlertDialog
          </Button>
          <Button onClick={() => setDialogOpen(true)}>Open Dialog</Button>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Stat tiles (current)</h2>
        <div className="flex gap-6">
          {['Environments', 'Ready', 'Packages'].map((label, i) => (
            <div key={label} className="bg-card border-border rounded-lg border px-4 py-3">
              <p className="text-muted-foreground text-xs font-medium">{label}</p>
              <p className="text-2xl font-bold">{[3, 2, 12][i]}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Card with content</h2>
        <Card>
          <CardContent className="space-y-4 pt-6">
            <h3 className="text-lg font-semibold">A regular Card</h3>
            <p className="text-muted-foreground text-sm">
              This is what most cards on the cloud overview look like — flat, white, slightly
              rounded. There&apos;s no visual hierarchy beyond a subtle border.
            </p>
          </CardContent>
        </Card>
      </section>

      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this agent?</AlertDialogTitle>
            <AlertDialogDescription>
              This stops <span className="font-mono">ph-pirate</span> and removes it from the
              environment. The agent&apos;s package data persists in the registry; you can add it
              back later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90 text-white">
              Remove agent
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add an Agent</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Package</Label>
              <Input placeholder="@powerhousedao/ph-pirate-cli" />
            </div>
            <div className="space-y-2">
              <Label>Version</Label>
              <Input placeholder="0.0.1-dev.0" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
