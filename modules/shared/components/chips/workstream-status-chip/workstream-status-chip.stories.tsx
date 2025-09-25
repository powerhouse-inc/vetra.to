import { WorkstreamStatus } from '@/modules/__generated__/graphql/switchboard-generated'
import WorkstreamStatusChip from './workstream-status-chip'
import type { Meta, StoryObj } from '@storybook/nextjs'

const meta: Meta<typeof WorkstreamStatusChip> = {
  title: 'Shared/Components/Chips/WorkstreamStatusChip',
  component: WorkstreamStatusChip,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    status: {
      control: 'select',
      options: Object.values(WorkstreamStatus),
      description: 'The status of the workstream',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const RfpDraft: Story = {
  args: {
    status: WorkstreamStatus.RfpDraft,
  },
}

export const PreworkRfc: Story = {
  args: {
    status: WorkstreamStatus.PreworkRfc,
  },
}

export const RfpCancelled: Story = {
  args: {
    status: WorkstreamStatus.RfpCancelled,
  },
}

export const OpenForProposals: Story = {
  args: {
    status: WorkstreamStatus.OpenForProposals,
  },
}

export const ProposalSubmitted: Story = {
  args: {
    status: WorkstreamStatus.ProposalSubmitted,
  },
}

export const Awarded: Story = {
  args: {
    status: WorkstreamStatus.Awarded,
  },
}

export const InProgress: Story = {
  args: {
    status: WorkstreamStatus.InProgress,
  },
}

export const Finished: Story = {
  args: {
    status: WorkstreamStatus.Finished,
  },
}

export const NotAwarded: Story = {
  args: {
    status: WorkstreamStatus.NotAwarded,
  },
}

export const AllStatuses: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <WorkstreamStatusChip status={WorkstreamStatus.RfpDraft} />
        <WorkstreamStatusChip status={WorkstreamStatus.PreworkRfc} />
        <WorkstreamStatusChip status={WorkstreamStatus.RfpCancelled} />
        <WorkstreamStatusChip status={WorkstreamStatus.OpenForProposals} />
        <WorkstreamStatusChip status={WorkstreamStatus.ProposalSubmitted} />
        <WorkstreamStatusChip status={WorkstreamStatus.Awarded} />
        <WorkstreamStatusChip status={WorkstreamStatus.InProgress} />
        <WorkstreamStatusChip status={WorkstreamStatus.Finished} />
        <WorkstreamStatusChip status={WorkstreamStatus.NotAwarded} />
      </div>
    </div>
  ),
}
