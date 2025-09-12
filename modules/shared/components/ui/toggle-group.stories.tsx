import type { Meta, StoryObj } from '@storybook/nextjs'
import React from 'react'
import { ToggleGroup, ToggleGroupItem } from './toggle-group'
import { Bold, Italic, Underline } from 'lucide-react'

const meta = {
  title: 'Shared/Shadcn/ToggleGroup',
  component: ToggleGroup,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof ToggleGroup>

export default meta
type Story = StoryObj<typeof meta>

export const Single: Story = {
  args: { type: 'single' },
  render: () => (
    <ToggleGroup variant="outline" type="single" defaultValue="bold">
      <ToggleGroupItem value="bold">
        <Bold className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="italic">
        <Italic className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="underline">
        <Underline className="size-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
}

export const Multiple: Story = {
  args: { type: 'multiple' },
  render: () => (
    <ToggleGroup variant="outline" type="multiple" defaultValue={['bold']}>
      <ToggleGroupItem value="bold">
        <Bold className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="italic">
        <Italic className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="underline">
        <Underline className="size-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
}
