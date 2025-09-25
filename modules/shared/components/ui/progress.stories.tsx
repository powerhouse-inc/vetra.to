import { Progress } from './progress'
import type { Meta, StoryObj } from '@storybook/nextjs'

const meta = {
  title: 'Shared/Shadcn/Progress',
  component: Progress,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Progress>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    value: 45,
    className: 'w-56',
  },
}
