import type { Meta, StoryObj } from '@storybook/nextjs'
import React from 'react'
import { Checkbox } from './checkbox'

const meta = {
  title: 'Shared/Shadcn/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { id: 'cb' },
} satisfies Meta<typeof Checkbox>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
