import React from 'react'
import { toast } from 'sonner'
import { Button } from './button'
import { Toaster } from './sonner'
import type { Meta, StoryObj } from '@storybook/nextjs'

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
