import { DetailsSection } from '@/modules/roadmap/components/details-section'
import { OverviewSection } from '@/modules/roadmap/components/overview-section'

export default function RoadmapPage() {
  return (
    <main className="container mx-auto mt-4 mb-8">
      <div className="flex flex-col">
        <h1 className="m-0 text-lg font-bold text-gray-900 md:text-xl md:leading-6 xl:text-2xl">
          Powerhouse Roadmaps
        </h1>
      </div>

      <div className="mt-16">
        <OverviewSection />
        <DetailsSection />
      </div>
    </main>
  )
}
