import { InternalLink } from './internal-link'
import type { Meta, StoryObj } from '@storybook/nextjs'

const meta = {
  title: 'Shared/Components/Buttons/Internal Link',
  component: InternalLink,
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/networks',
      },
    },
  },
} satisfies Meta<typeof InternalLink>

export default meta
type Story = StoryObj<typeof meta>

export const Basic: Story = {
  name: 'InternalLink',
  args: {
    href: '/',
    children: 'Internal Link',
  },
}
