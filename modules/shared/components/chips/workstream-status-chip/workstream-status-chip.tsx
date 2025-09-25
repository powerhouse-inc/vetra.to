import { useMemo } from 'react'
import { WorkstreamStatus } from '@/modules/__generated__/graphql/switchboard-generated'
import { cn } from '@/modules/shared/lib/utils'

interface WorkstreamStatusChipProps {
  status: WorkstreamStatus
}

export default function WorkstreamStatusChip({ status }: WorkstreamStatusChipProps) {
  const { label, bgColor, textColor } = useMemo(() => {
    switch (status) {
      case WorkstreamStatus.RfpDraft:
        return {
          label: 'RFP Draft',
          bgColor: 'bg-muted',
          textColor: 'text-muted-foreground',
        }
      case WorkstreamStatus.PreworkRfc:
        return {
          label: 'Prework RFC',
          bgColor: 'bg-muted',
          textColor: 'text-muted-foreground',
        }
      case WorkstreamStatus.RfpCancelled:
        return {
          label: 'RFP Cancelled',
          bgColor: 'bg-destructive/30',
          textColor: 'text-destructive',
        }
      case WorkstreamStatus.OpenForProposals:
        return {
          label: 'Open for proposals',
          bgColor: 'bg-status-progress/30',
          textColor: 'text-status-progress',
        }
      case WorkstreamStatus.ProposalSubmitted:
        return {
          label: 'Proposal submitted',
          bgColor: 'bg-status-progress/30',
          textColor: 'text-status-progress',
        }
      case WorkstreamStatus.Awarded:
        return {
          label: 'Awarded',
          bgColor: 'bg-status-progress/30',
          textColor: 'text-status-progress',
        }
      case WorkstreamStatus.InProgress:
        return {
          label: 'In progress',
          bgColor: 'bg-status-progress/30',
          textColor: 'text-status-progress',
        }
      case WorkstreamStatus.Finished:
        return {
          label: 'Finished',
          bgColor: 'bg-status-success/30',
          textColor: 'text-status-success',
        }
      case WorkstreamStatus.NotAwarded:
        return {
          label: 'Not Awarded',
          bgColor: 'bg-destructive/30',
          textColor: 'text-destructive',
        }
      default:
        return {
          label: status,
          bgColor: 'bg-muted',
          textColor: 'text-muted-foreground',
        }
    }
  }, [status])

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-md px-3 py-px text-xs/5.5 font-semibold text-nowrap uppercase',
        bgColor,
        textColor,
      )}
    >
      {label}
    </div>
  )
}
