import type { Meta, StoryObj } from '@storybook/nextjs'

import { PackageRowCard } from './package-row-card'

const meta = {
  title: 'Packages/PackageRowCard',
  component: PackageRowCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    packageName: 'Atlas Package',
    publisherName: 'BAI-team',
    description:
      'The Invoice package offers a convenient way for contributors to get paid in crypto or fiat',
    driveName: 'Vetra Studio Drive',
    onBack: () => {},
    onPublisherClick: () => {},
    onOpenInConnect: () => {},
  },
  decorators: [
    (Story) => (
      <div style={{ width: 981 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PackageRowCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const LongDescription: Story = {
  args: {
    packageName: 'Contributor Billing',
    publisherName: 'MakerDAO',
    description:
      'A comprehensive billing and invoicing solution for DAO contributors that handles multiple currencies, recurring payments, and automated tax reporting across jurisdictions',
  },
}

export const CustomDrive: Story = {
  args: {
    packageName: 'Governance Toolkit',
    publisherName: 'Sky-team',
    driveName: 'Custom Drive Name',
  },
}
