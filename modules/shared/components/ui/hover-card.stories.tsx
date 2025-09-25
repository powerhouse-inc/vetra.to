import React from 'react'
import { HoverCard, HoverCardContent, HoverCardTrigger } from './hover-card'
import type { Meta, StoryObj } from '@storybook/nextjs'

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
