import { ScopeOfWork_DeliverableSetStatus } from '@/modules/__generated__/graphql/switchboard-generated'
import DeliverableSetStatusChip from './deliverable-set-status-chip'
import type { Meta, StoryObj } from '@storybook/nextjs'

const meta: Meta<typeof DeliverableSetStatusChip> = {
  title: 'Shared/Components/Chips/DeliverableSetStatusChip',
  component: DeliverableSetStatusChip,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    status: {
      control: 'select',
      options: Object.values(ScopeOfWork_DeliverableSetStatus),
      description: 'The status of the deliverable set',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Todo: Story = {
  args: {
    status: ScopeOfWork_DeliverableSetStatus.Todo,
  },
}

export const InProgress: Story = {
  args: {
    status: ScopeOfWork_DeliverableSetStatus.InProgress,
  },
}

export const Finished: Story = {
  args: {
    status: ScopeOfWork_DeliverableSetStatus.Finished,
  },
}

export const Draft: Story = {
  args: {
    status: ScopeOfWork_DeliverableSetStatus.Draft,
  },
}

export const Canceled: Story = {
  args: {
    status: ScopeOfWork_DeliverableSetStatus.Canceled,
  },
}

export const AllStatuses: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <DeliverableSetStatusChip status={ScopeOfWork_DeliverableSetStatus.Todo} />
        <DeliverableSetStatusChip status={ScopeOfWork_DeliverableSetStatus.InProgress} />
        <DeliverableSetStatusChip status={ScopeOfWork_DeliverableSetStatus.Finished} />
        <DeliverableSetStatusChip status={ScopeOfWork_DeliverableSetStatus.Draft} />
        <DeliverableSetStatusChip status={ScopeOfWork_DeliverableSetStatus.Canceled} />
      </div>
    </div>
  ),
}
