import React from 'react'
import Image from 'next/image'
import { AspectRatio } from './aspect-ratio'
import type { Meta, StoryObj } from '@storybook/nextjs'

const meta = {
  title: 'Shared/Shadcn/AspectRatio',
  component: AspectRatio,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof AspectRatio>

export default meta
type Story = StoryObj<typeof meta>

export const ImageComponent: Story = {
  render: () => (
    <div style={{ width: 300 }}>
      <AspectRatio ratio={16 / 9}>
        <Image
          src="https://picsum.photos/seed/storybook/600/338"
          alt="Landscape image for aspect ratio demo"
          fill
          style={{ objectFit: 'cover' }}
        />
      </AspectRatio>
    </div>
  ),
}
