import type { Meta, StoryObj } from '@storybook/nextjs'
import React from 'react'
import { Switch } from './switch'

const meta = {
  title: 'Shared/Shadcn/Switch',
  component: Switch,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { id: 'sw' },
} satisfies Meta<typeof Switch>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
