import type { Meta, StoryObj } from '@storybook/nextjs'
import React from 'react'
import { Label } from './label'

const meta = {
  title: 'Shared/Shadcn/Label',
  component: Label,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { children: 'Label' },
} satisfies Meta<typeof Label>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
