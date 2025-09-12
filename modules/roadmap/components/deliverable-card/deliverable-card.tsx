'use client'

import { useCallback, useState } from 'react'
import { useMediaQuery } from 'usehooks-ts'
import { DeliverableStatusChip } from '@/modules/shared/components/chips/deliverable-status-chip'
import { Avatar, AvatarFallback, AvatarImage } from '@/modules/shared/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/modules/shared/components/ui/tooltip'
import { cn } from '@/modules/shared/lib/utils'
import {
  DeliverableStatus,
  type IncrementedDeliverable,
  type Deliverable,
  type MDeliverable,
} from '../milestone-details-card/type'
import DeliverablePercentageBar from './deliverable-percentage-bar'
import DeliverableStorypointBar from './deliverable-storypoint-bar'
import MilestoneLink from './milestone-link'
import ProjectLink from './project-link'

export type DeliverableViewMode = 'compacted' | 'detailed'

interface DeliverableCardProps {
  deliverable: Deliverable | MDeliverable
  viewMode: DeliverableViewMode
  maxKeyResultsOnRow: number
  isProjectCard?: boolean
}

export default function DeliverableCard({
  deliverable,
  viewMode,
  maxKeyResultsOnRow,
  isProjectCard,
}: DeliverableCardProps) {
  const isMobile = useMediaQuery('(min-width: 768px)')
  const [expanded, setExpanded] = useState<boolean>(false)
  const handleToggleExpanded = useCallback(() => {
    setExpanded((prev) => !prev)
  }, [])
  const deliverableProgress =
    'workProgress' in deliverable ? deliverable.workProgress : deliverable.progress

  return (
    <div
      className={cn(
        'flex-start flex flex-col rounded-xl border p-4 shadow-sm',
        !isMobile && viewMode === 'compacted' && !expanded ? 'h-fit' : 'h-auto',
      )}
    >
      {/* Header */}
      <div className="flex-start flex gap-6 self-stretch">
        <div className="mb-2 flex max-w-[calc(100%-51px)] flex-1 flex-col items-start">
          <div className={cn(viewMode !== 'detailed' && 'truncate', 'self-stretch font-semibold')}>
            {deliverable.title}
          </div>
        </div>
        <div className="flex items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar className="size-6.5 self-start border-2 shadow-md">
                <AvatarImage src={deliverable.owner.imageUrl} />
                <AvatarFallback>{deliverable.owner.name.charAt(0)}</AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="end">
              <div className="flex flex-col gap-4">
                <div className="font-bold tracking-wide">Deliverable Owner</div>

                <div className="flex items-center gap-2">
                  <Avatar className="size-8 border-2 shadow-md">
                    <AvatarImage src={deliverable.owner.imageUrl} />
                    <AvatarFallback>{deliverable.owner.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="text-base tracking-wide">{deliverable.owner.name}</div>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* progress */}
      <div className="flex w-full items-center gap-2">
        <DeliverableStatusChip status={deliverable.status} />

        {deliverable.status === DeliverableStatus.IN_PROGRESS &&
          deliverableProgress &&
          (deliverableProgress.__typename === 'Percentage' ? (
            <DeliverablePercentageBar percentage={deliverableProgress.value} />
          ) : (
            <DeliverableStorypointBar
              total={deliverableProgress.total}
              completed={deliverableProgress.completed}
            />
          ))}
      </div>

      {(viewMode === 'detailed' || expanded) && (
        <div className="mt-2 flex flex-col gap-2 text-sm xl:text-base">
          {deliverable.description?.split('\n').map((paragraph, index) => (
            <p className="m-0" key={index}>
              {paragraph}
            </p>
          ))}
        </div>
      )}

      <div className="mt-auto flex w-full flex-col pt-4">
        {isProjectCard
          ? (deliverable as IncrementedDeliverable).milestoneOverride && (
              <MilestoneLink
                roadmapSlug={
                  (deliverable as IncrementedDeliverable).milestoneOverride?.roadmapSlug ?? ''
                }
                code={(deliverable as IncrementedDeliverable).milestoneOverride?.code ?? ''}
              />
            )
          : (deliverable as MDeliverable).budgetAnchor.project &&
            (deliverable as MDeliverable).budgetAnchor.project.code &&
            (deliverable as MDeliverable).budgetAnchor.project.title && (
              <ProjectLink
                href={'#'}
                code={(deliverable as MDeliverable).budgetAnchor.project.code}
                name={(deliverable as MDeliverable).budgetAnchor.project.title}
              />
            )}
        {/* <KeyResults
          keyResults={deliverable.keyResults}
          viewMode={viewMode}
          expanded={expanded}
          handleToggleExpand={handleToggleExpand}
          maxKeyResultsOnRow={maxKeyResultsOnRow}
        /> */}
      </div>
    </div>
  )
}
