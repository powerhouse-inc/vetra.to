import Contributors from './contributors'
import Coordinators from './coordinators'
import DeliverablesSection from './deliverables-section'
import MilestoneProgress from './milestone-progress'
import TargetData from './target-data'
import TitleAndDescription from './title-and-description'
import type { Milestone } from './type'

interface MilestoneDetailsCardProps {
  milestone: Milestone
}

export default function MilestoneDetailsCard({ milestone }: MilestoneDetailsCardProps) {
  return (
    <article id={milestone.id} className="relative scroll-mt-[170px] md:flex md:gap-6 xl:gap-8">
      <div className="flex flex-col gap-4 md:flex-row md:gap-6 xl:sticky xl:top-[170px] xl:h-fit">
        <aside className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 md:w-[340px] lg:w-[304px] lg:gap-4 lg:px-4 lg:pt-4 lg:pb-6 xl:w-[379px] xl:px-6 2xl:w-[416px] dark:border-neutral-800 dark:bg-neutral-900">
          <div className="inline-flex max-w-fit items-center gap-1 rounded-lg border border-neutral-200 px-2 py-1 dark:border-neutral-700">
            <div className="text-base leading-6 font-semibold text-slate-600 lg:text-xl lg:leading-tight lg:font-bold dark:text-slate-300">
              {milestone.sequenceCode}
            </div>
            <div className="text-base leading-6 font-semibold text-gray-900 lg:text-xl lg:leading-tight lg:font-bold dark:text-gray-50">
              {milestone.code}
            </div>
          </div>

          <MilestoneProgress data={milestone.scope} />
          <TargetData targetDate={milestone.targetDate} />
          <Coordinators coordinators={milestone.coordinators} />
          <Contributors contributors={milestone.contributors} />
        </aside>

        <div className="block lg:hidden">
          <TitleAndDescription title={milestone.title} description={milestone.description} />
        </div>
      </div>

      <main className="mt-4 flex flex-col lg:mt-5 lg:max-w-[calc(100%-304px-24px)] lg:gap-6 xl:max-w-[calc(100%-379px-32px)] 2xl:max-w-[calc(100%-416px-32px)]">
        <div className="hidden lg:block">
          <TitleAndDescription title={milestone.title} description={milestone.description} />
        </div>

        <DeliverablesSection deliverables={milestone.scope.deliverables} />
      </main>
    </article>
  )
}
