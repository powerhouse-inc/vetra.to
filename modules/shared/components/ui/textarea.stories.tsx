import type { Meta, StoryObj } from '@storybook/nextjs'
import React from 'react'
import { Textarea } from './textarea'

const meta = {
  title: 'Shared/Shadcn/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { placeholder: 'Type your message here' },
} satisfies Meta<typeof Textarea>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
