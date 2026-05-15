'use client'
import { Folders, Loader2, Plus } from 'lucide-react'
import { usePHToast } from '@powerhousedao/reactor-browser'
import { Button } from '@/modules/shared/components/ui/button'
import { Card, CardContent } from '@/modules/shared/components/ui/card'
import { useTeamSpaces } from '@/modules/profile/lib/use-team-spaces'
import type { FullTeam } from '@/modules/profile/lib/create-team-queries'
import { SpaceCard } from './space-card'

export function SpacesSection({ team }: { team: FullTeam }) {
  const { createSpace, isPending } = useTeamSpaces(team)
  const toast = usePHToast()

  const doCreate = async () => {
    try {
      await createSpace()
      toast?.('Space added', { type: 'success' })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Something went wrong'
      toast?.(`Couldn't add space — ${msg}`, { type: 'error' })
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-muted-foreground max-w-prose text-sm">
          Group your packages into spaces. Both appear on your team&apos;s public page.
        </p>
        <Button onClick={() => void doCreate()} disabled={isPending}>
          {isPending ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Plus className="mr-1.5 size-4" />
          )}
          Add space
        </Button>
      </div>

      {team.spaces.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
            <div className="bg-muted flex size-12 items-center justify-center rounded-full">
              <Folders className="text-muted-foreground size-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold">No spaces yet</h3>
              <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-sm">
                Spaces are how you organise the packages your team showcases. Create one to get
                started.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {team.spaces.map((s) => (
            <SpaceCard key={s.id} team={team} space={s} />
          ))}
        </div>
      )}
    </div>
  )
}
