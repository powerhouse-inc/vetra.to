import type { Meta, StoryObj } from '@storybook/nextjs'
import React from 'react'
import { Input } from './input'

const meta = {
  title: 'Shared/Shadcn/Input',
  component: Input,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { placeholder: 'Type here' },
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
