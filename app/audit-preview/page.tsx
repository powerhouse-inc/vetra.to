'use client'

import { Plus } from 'lucide-react'
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
import { Card, CardContent, HeroCard } from '@/modules/shared/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/modules/shared/components/ui/dialog'
import { Input } from '@/modules/shared/components/ui/input'
import { Label } from '@/modules/shared/components/ui/label'

/**
 * Visual audit preview. Used for playwright screenshots while iterating
 * on the visual foundation. Not linked from anywhere; safe to remove
 * once the upgrade ships.
 */
export default function AuditPreview() {
  const [alertOpen, setAlertOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <main className="min-h-screen space-y-12 p-12">
      <div>
        <h1 className="text-3xl font-bold">Visual foundation preview</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Ambient background + glass modals + HeroCard variant
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Triggers</h2>
        <div className="flex gap-2">
          <Button onClick={() => setAlertOpen(true)} variant="destructive">
            Open AlertDialog
          </Button>
          <Button onClick={() => setDialogOpen(true)}>Open Dialog</Button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Stat tiles</h2>
        <div className="flex gap-6">
          {(['Environments', 'Ready', 'Packages'] as const).map((label, i) => (
            <div key={label} className="bg-card border-border rounded-lg border px-4 py-3">
              <p className="text-muted-foreground text-xs font-medium">{label}</p>
              <p className="text-2xl font-bold">{[3, 2, 12][i]}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Card vs HeroCard</h2>
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="space-y-2 pt-6">
              <h3 className="text-lg font-semibold">Standard Card</h3>
              <p className="text-muted-foreground text-sm">
                Used everywhere today. Solid bg, soft border in dark mode, no accent.
              </p>
            </CardContent>
          </Card>
          <HeroCard>
            <div className="space-y-2 p-6">
              <h3 className="text-lg font-semibold">Hero (accent top)</h3>
              <p className="text-muted-foreground text-sm">
                Same baseline + a hairline brand-color stripe at the top edge.
              </p>
            </div>
          </HeroCard>
          <HeroCard glass>
            <div className="space-y-2 p-6">
              <h3 className="text-lg font-semibold">Hero (glass + accent)</h3>
              <p className="text-muted-foreground text-sm">
                Frosted-glass surface — sits over the ambient background.
              </p>
            </div>
          </HeroCard>
          <HeroCard accentTop={false} glass>
            <div className="space-y-2 p-6">
              <h3 className="text-lg font-semibold">Hero (glass, no stripe)</h3>
              <p className="text-muted-foreground text-sm">
                For when you want the frosted look without the brand cue.
              </p>
            </div>
          </HeroCard>
        </div>
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
          <DialogHeader icon={<Plus />}>
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
