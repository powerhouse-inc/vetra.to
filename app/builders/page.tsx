import { BuilderList } from '@/modules/builders/components/builder-list'
import { BuilderSearch } from '@/modules/builders/components/builder-search'
import { BuildersPageClient } from '@/modules/builders/components/builders-page-client'
import { fetchAllBuilderAccounts } from '@/modules/builders/lib/server-data'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/modules/shared/components/ui/breadcrumb'

export default async function BuildersPage() {
  const builderTeams = await fetchAllBuilderAccounts('team')

  return (
    <BuildersPageClient initialBuilders={builderTeams}>
      <main className="container mx-auto max-w-[var(--container-width)] space-y-8 p-8">
        {/* Header Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold">Builders</h1>
              {/* Breadcrumbs */}
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/builders">Builders</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Overview</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            {/* Search Bar */}
            <BuilderSearch />
          </div>
        </div>

        {/* Builder Teams List */}
        <div className="space-y-4">
          <BuilderList initialBuilders={builderTeams} />
        </div>
      </main>
    </BuildersPageClient>
  )
}
