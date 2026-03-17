'use client'

import { Plus } from 'lucide-react'
import Link from 'next/link'

import { useEnvironments } from '@/modules/cloud/hooks/use-environment'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/modules/shared/components/ui/breadcrumb'
import { Button } from '@/modules/shared/components/ui/button'
import { CloudEnvironments } from './cloud-projects'

export function CloudDashboard() {
  const environments = useEnvironments()
  const runningCount = environments.filter((e) => e.state.status === 'STARTED').length
  const totalPackages = environments.reduce((sum, e) => sum + (e.state.packages?.length ?? 0), 0)

  return (
    <main className="mx-auto mt-20 max-w-[var(--container-width)] space-y-8 px-6 py-8">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Your Environments</h1>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/cloud">Cloud</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <Button asChild>
          <Link href="/cloud/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Environment
          </Link>
        </Button>
      </div>

      {environments.length > 0 && (
        <div className="flex gap-6">
          <div className="bg-card border-border rounded-lg border px-4 py-3">
            <p className="text-muted-foreground text-xs font-medium">Environments</p>
            <p className="text-2xl font-bold">{environments.length}</p>
          </div>
          <div className="bg-card border-border rounded-lg border px-4 py-3">
            <p className="text-muted-foreground text-xs font-medium">Running</p>
            <p className="text-success text-2xl font-bold">{runningCount}</p>
          </div>
          <div className="bg-card border-border rounded-lg border px-4 py-3">
            <p className="text-muted-foreground text-xs font-medium">Packages</p>
            <p className="text-2xl font-bold">{totalPackages}</p>
          </div>
        </div>
      )}

      <CloudEnvironments />
    </main>
  )
}
