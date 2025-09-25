import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from './avatar'
import type { Meta, StoryObj } from '@storybook/nextjs'

const meta = {
  title: 'Shared/Shadcn/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Avatar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="https://i.pravatar.cc/100?img=5" alt="avatar" />
      <AvatarFallback>JD</AvatarFallback>
    </Avatar>
  ),
}

export const FallbackOnly: Story = {
  render: () => (
    <Avatar>
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
  ),
}

export const BrokenImageFallback: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="/broken-image.png" alt="avatar" />
      <AvatarFallback>NA</AvatarFallback>
    </Avatar>
  ),
}

export const Group: Story = {
  render: () => (
    <div className="flex -space-x-3">
      <Avatar className="ring-background ring-2">
        <AvatarImage src="https://i.pravatar.cc/100?img=1" alt="A" />
        <AvatarFallback>A</AvatarFallback>
      </Avatar>
      <Avatar className="ring-background ring-2">
        <AvatarImage src="https://i.pravatar.cc/100?img=2" alt="B" />
        <AvatarFallback>B</AvatarFallback>
      </Avatar>
      <Avatar className="ring-background ring-2">
        <AvatarImage src="/broken-image.png" alt="C" />
        <AvatarFallback>C</AvatarFallback>
      </Avatar>
      <Avatar className="ring-background ring-2">
        <AvatarFallback>+2</AvatarFallback>
      </Avatar>
    </div>
  ),
}
