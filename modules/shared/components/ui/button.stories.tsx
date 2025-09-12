import type { Meta, StoryObj } from '@storybook/nextjs'
import { Button } from './button'
import { ArrowRight, Trash2, Mail } from 'lucide-react'
import React from 'react'

const meta = {
  title: 'Shared/Shadcn/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A button component built with Tailwind CSS and class-variance-authority. Supports multiple variants, sizes, and rendering as a child element using Radix Slot.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
    },
    asChild: { control: 'boolean' },
  },
  args: {
    children: 'Button',
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    variant: 'default',
  },
}

export const Secondary: Story = {
  args: {
    variant: 'secondary',
  },
}

export const Outline: Story = {
  args: {
    variant: 'outline',
  },
}

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: (
      <>
        <Trash2 />
        Delete
      </>
    ),
  },
}

export const Ghost: Story = {
  args: {
    variant: 'ghost',
  },
}

export const Link: Story = {
  args: {
    variant: 'link',
    children: (
      <>
        Learn more
        <ArrowRight />
      </>
    ),
  },
}

export const Small: Story = {
  args: {
    size: 'sm',
  },
}

export const Large: Story = {
  args: {
    size: 'lg',
  },
}

export const WithIcon: Story = {
  args: {
    children: (
      <>
        <Mail />
        Email
      </>
    ),
  },
}

export const IconOnly: Story = {
  args: {
    size: 'icon',
    children: <Mail />,
    'aria-label': 'Mail',
  },
}

export const AsChildLink: Story = {
  name: 'asChild - anchor',
  args: {
    asChild: true,
    children: (
      <a href="#" onClick={(e) => e.preventDefault()}>
        Open docs
      </a>
    ),
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
  },
}

export const Playground: Story = {
  args: {
    variant: 'default',
    size: 'default',
    children: 'Play with controls',
  },
}
