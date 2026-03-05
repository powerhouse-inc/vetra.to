// Force dynamic rendering to prevent build-time API requests
export const dynamic = 'force-dynamic'

export const metadata: unknown = {
  title: 'Vetra Cloud',
  description: 'The Cloud for Powerhouse!',
}

export default function CloudPage() {
  return (
    <main className="container mx-auto mt-[80px] max-w-[var(--container-width)] space-y-8 p-8">
      {/* Header Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">Page goes here</h1>
            {/* Breadcrumbs */}
          </div>

          {/* Search Bar */}
        </div>
      </div>

      {/* Builder Teams List */}
      <div className="space-y-4"></div>
    </main>
  )
}
