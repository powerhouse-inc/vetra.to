import type { Meta, StoryObj } from '@storybook/nextjs'
import React from 'react'
import { Skeleton } from './skeleton'

const meta = {
  title: 'Shared/Shadcn/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Skeleton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12 }}>
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-8 w-24" />
    </div>
  ),
}
