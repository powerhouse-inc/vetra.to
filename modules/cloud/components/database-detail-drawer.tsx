'use client'

import { Database } from 'lucide-react'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/modules/shared/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shared/components/ui/tabs'

import { DatabaseBackupsTab } from './database-backups-tab'
import { DatabaseOverviewTab } from './database-overview-tab'

type Props = {
  open: boolean
  onClose: () => void
  tenantId: string | null
  clusterName: string
  canEdit: boolean
  activeTab: string
  onTabChange: (tab: string) => void
}

export function DatabaseDetailDrawer({
  open,
  onClose,
  tenantId,
  clusterName,
  canEdit,
  activeTab,
  onTabChange,
}: Props) {
  // Default to Backups since that's the actionable tab; Overview is just facts.
  const safeTab = activeTab === 'overview' ? 'overview' : 'backups'

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl lg:max-w-3xl"
      >
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Database
          </SheetTitle>
          <SheetDescription>
            <span className="font-mono">{clusterName}</span>
          </SheetDescription>
        </SheetHeader>

        <Tabs
          value={safeTab}
          onValueChange={onTabChange}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <TabsList className="mx-6 mt-4 self-start">
            <TabsTrigger value="backups">Backups</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            <TabsContent value="backups" className="mt-0">
              <DatabaseBackupsTab tenantId={tenantId} canEdit={canEdit} />
            </TabsContent>
            <TabsContent value="overview" className="mt-0">
              <DatabaseOverviewTab clusterName={clusterName} />
            </TabsContent>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
