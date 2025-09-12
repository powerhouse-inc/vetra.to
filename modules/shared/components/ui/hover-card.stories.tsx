import type { Meta, StoryObj } from '@storybook/nextjs'
import React from 'react'
import { HoverCard, HoverCardTrigger, HoverCardContent } from './hover-card'

const meta = {
  title: 'Shared/Shadcn/HoverCard',
  component: HoverCard,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof HoverCard>

export default meta
type Story = StoryObj<typeof meta>

export const Basic: Story = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger>Hover me</HoverCardTrigger>
      <HoverCardContent>Some content</HoverCardContent>
    </HoverCard>
  ),
}
