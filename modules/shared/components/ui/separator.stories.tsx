import type { Meta, StoryObj } from '@storybook/nextjs'
import React from 'react'
import { Separator } from './separator'

const meta = {
  title: 'Shared/Shadcn/Separator',
  component: Separator,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Separator>

export default meta
type Story = StoryObj<typeof meta>

export const Horizontal: Story = {
  render: () => (
    <div style={{ width: 320 }}>
      <div>Above</div>
      <Separator />
      <div>Below</div>
    </div>
  ),
}
