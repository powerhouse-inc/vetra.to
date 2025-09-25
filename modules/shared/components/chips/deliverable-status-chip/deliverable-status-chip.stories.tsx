import { ScopeOfWork_DeliverableStatus } from '@/modules/__generated__/graphql/switchboard-generated'
import DeliverableStatusChip from './deliverable-status-chip'
import type { Meta, StoryObj } from '@storybook/nextjs'

const meta: Meta<typeof DeliverableStatusChip> = {
  title: 'Shared/Components/Chips/DeliverableStatusChip',
  component: DeliverableStatusChip,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    status: {
      control: 'select',
      options: Object.values(ScopeOfWork_DeliverableStatus),
      description: 'The status of the deliverable',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Todo: Story = {
  args: {
    status: ScopeOfWork_DeliverableStatus.Todo,
  },
}

export const InProgress: Story = {
  args: {
    status: ScopeOfWork_DeliverableStatus.InProgress,
  },
}

export const Delivered: Story = {
  args: {
    status: ScopeOfWork_DeliverableStatus.Delivered,
  },
}

export const Draft: Story = {
  args: {
    status: ScopeOfWork_DeliverableStatus.Draft,
  },
}

export const Blocked: Story = {
  args: {
    status: ScopeOfWork_DeliverableStatus.Blocked,
  },
}

export const Canceled: Story = {
  args: {
    status: ScopeOfWork_DeliverableStatus.Canceled,
  },
}

export const WontDo: Story = {
  args: {
    status: ScopeOfWork_DeliverableStatus.WontDo,
  },
}

export const AllStatuses: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <DeliverableStatusChip status={ScopeOfWork_DeliverableStatus.Todo} />
        <DeliverableStatusChip status={ScopeOfWork_DeliverableStatus.InProgress} />
        <DeliverableStatusChip status={ScopeOfWork_DeliverableStatus.Delivered} />
        <DeliverableStatusChip status={ScopeOfWork_DeliverableStatus.Draft} />
        <DeliverableStatusChip status={ScopeOfWork_DeliverableStatus.Blocked} />
        <DeliverableStatusChip status={ScopeOfWork_DeliverableStatus.Canceled} />
        <DeliverableStatusChip status={ScopeOfWork_DeliverableStatus.WontDo} />
      </div>
    </div>
  ),
}
