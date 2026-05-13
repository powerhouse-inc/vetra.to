'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Box, Folders, Users } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shared/components/ui/tabs'

export type TeamManageTab = 'profile' | 'members' | 'spaces'

const TABS: {
  key: TeamManageTab
  label: string
  icon: React.ComponentType<{ className?: string }>
}[] = [
  { key: 'profile', label: 'Profile', icon: Box },
  { key: 'members', label: 'Members', icon: Users },
  { key: 'spaces', label: 'Spaces & Packages', icon: Folders },
]

export function TeamTabs({
  slug,
  children,
}: {
  slug: string
  children: { profile: React.ReactNode; members: React.ReactNode; spaces: React.ReactNode }
}) {
  const router = useRouter()
  const params = useSearchParams()
  const rawTab = params.get('tab')
  const active: TeamManageTab = rawTab === 'members' || rawTab === 'spaces' ? rawTab : 'profile'

  const onChange = useCallback(
    (next: string) => {
      const sp = new URLSearchParams(params.toString())
      sp.set('tab', next)
      router.replace(`/profile/teams/${slug}?${sp.toString()}`, { scroll: false })
    },
    [params, router, slug],
  )

  return (
    <Tabs value={active} onValueChange={onChange} className="w-full">
      <TabsList className="mb-6 grid w-full grid-cols-3 sm:inline-flex sm:w-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <TabsTrigger key={key} value={key} className="gap-1.5">
            <Icon className="size-4" /> {label}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value="profile">{children.profile}</TabsContent>
      <TabsContent value="members">{children.members}</TabsContent>
      <TabsContent value="spaces">{children.spaces}</TabsContent>
    </Tabs>
  )
}
