import { ExternalLink } from './external-link'
import type { Meta, StoryObj } from '@storybook/nextjs'

const meta = {
  title: 'Shared/Components/Buttons/External Link Button',
  component: ExternalLink,
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/networks',
      },
    },
  },
} satisfies Meta<typeof ExternalLink>

export default meta
type Story = StoryObj<typeof meta>

export const Basic: Story = {
  name: 'ExternalLink',
  args: {
    href: 'https://www.google.com',
    children: 'External Link',
  },
}
