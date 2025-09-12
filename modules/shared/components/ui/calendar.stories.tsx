import type { Meta, StoryObj } from '@storybook/nextjs'
import React from 'react'
import { Calendar } from './calendar'

const meta = {
  title: 'Shared/Shadcn/Calendar',
  component: Calendar,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Calendar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => <Calendar mode="single" className="rounded-lg border shadow-sm" />,
}
