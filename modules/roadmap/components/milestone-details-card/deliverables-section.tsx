import { cn } from '@/modules/shared/lib/utils'
import { splitInRows } from '../../lib/deliverables'
import { DeliverableCard } from '../deliverable-card'
import type { MDeliverable } from './type'

interface DeliverablesSectionProps {
  deliverables: MDeliverable[]
}

export default function DeliverablesSection({ deliverables }: DeliverablesSectionProps) {
  const deliverablesRows = splitInRows(deliverables, 2)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between self-stretch lg:pr-2 xl:pr-4">
        <div className="flex-start flex gap-2.5">
          <h3 className="text-lg/6 font-bold xl:text-xl/6">Deliverables</h3>
          <div className="text-lg/6 font-bold xl:text-xl/6">{deliverables.length}</div>
        </div>
      </div>

      <div
        className={cn(
          'flex flex-col gap-4 md:flex-row md:flex-wrap md:gap-6 xl:gap-8',
          'md:[&>*]:w-full md:[&>*]:max-w-[calc(50%-12px)]',
          'xl:gap-7 xl:[&>*]:max-w-[calc(50%-16px)]',
        )}
      >
        {deliverables.length === 0 && (
          <div className="flex w-full max-w-full justify-center py-16 text-center text-2xl leading-normal font-semibold tracking-[0.025em] text-gray-400 md:text-3xl dark:text-slate-400">
            No Deliverable Available
          </div>
        )}

        {deliverablesRows.map((row) =>
          row.map((deliverable) => (
            <DeliverableCard
              key={deliverable.id}
              deliverable={deliverable}
              viewMode="detailed"
              maxKeyResultsOnRow={row
                .map((d) => d.keyResults.length)
                .reduce((a, b) => Math.max(a, b), 0)}
              isProjectCard={false}
            />
          )),
        )}
      </div>
    </div>
  )
}
