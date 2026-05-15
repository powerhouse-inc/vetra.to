'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Users, Package, Settings } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/modules/shared/components/ui/tabs'
import { TeamsTab } from './teams-tab'
import { PackagesTab } from './packages-tab'
import { SettingsTab } from './settings-tab'

const VALID_TABS = ['teams', 'packages', 'settings'] as const
type ProfileTab = (typeof VALID_TABS)[number]

function isValidTab(v: string | null): v is ProfileTab {
  return v !== null && (VALID_TABS as readonly string[]).includes(v)
}

export function ProfileTabs({ address }: { address: string }) {
  const router = useRouter()
  const params = useSearchParams()
  const rawTab = params.get('tab')
  const active: ProfileTab = isValidTab(rawTab) ? rawTab : 'teams'

  const onChange = useCallback(
    (next: string) => {
      const sp = new URLSearchParams(params.toString())
      sp.set('tab', next)
      router.replace(`/profile?${sp.toString()}`, { scroll: false })
    },
    [params, router],
  )

  return (
    <Tabs value={active} onValueChange={onChange} className="w-full">
      <TabsList className="mb-6 grid w-full grid-cols-3 sm:inline-flex sm:w-auto">
        <TabsTrigger value="teams" className="gap-1.5">
          <Users className="size-4" /> Teams
        </TabsTrigger>
        <TabsTrigger value="packages" className="gap-1.5">
          <Package className="size-4" /> Packages
        </TabsTrigger>
        <TabsTrigger value="settings" className="gap-1.5">
          <Settings className="size-4" /> Settings
        </TabsTrigger>
      </TabsList>

      <TabsContent value="teams">
        <TeamsTab address={address} />
      </TabsContent>
      <TabsContent value="packages">
        <PackagesTab />
      </TabsContent>
      <TabsContent value="settings">
        <SettingsTab />
      </TabsContent>
    </Tabs>
  )
}
