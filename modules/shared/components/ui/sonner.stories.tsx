import type { Meta, StoryObj } from '@storybook/nextjs'
import React from 'react'
import { Toaster } from './sonner'
import { toast } from 'sonner'
import { Button } from './button'

const meta = {
  title: 'Shared/Shadcn/Sonner',
  component: Toaster,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Toaster>

export default meta
type Story = StoryObj<typeof meta>

export const Basic: Story = {
  render: () => (
    <div>
      <Button onClick={() => toast('Hello!')}>Toast</Button>
      <Toaster />
    </div>
  ),
}
