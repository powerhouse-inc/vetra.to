import Navbar from './navbar'
import type { Meta, StoryObj } from '@storybook/nextjs'

const meta = {
  title: 'Shared/Components/Navbar',
  component: Navbar,
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/networks',
      },
    },
  },
} satisfies Meta<typeof Navbar>

export default meta
type Story = StoryObj<typeof meta>

export const Basic: Story = {
  name: 'Navbar (Achra)',
}

export const WithPowerhousePathname: Story = {
  name: 'Navbar (Powerhouse)',
  parameters: {
    nextjs: {
      navigation: {
        pathname: '/network/powerhouse/roadmap',
      },
    },
  },
}

export const WithSkyPathname: Story = {
  name: 'Navbar (Sky)',
  parameters: {
    nextjs: {
      navigation: {
        pathname: '/network/sky/finances',
      },
    },
  },
}
