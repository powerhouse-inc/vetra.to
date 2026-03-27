import type { Meta, StoryObj } from '@storybook/nextjs'

import { PackageCard } from './package-card'

const meta = {
  title: 'Packages/PackageCard',
  component: PackageCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    name: 'Atlas',
    moduleType: 'Document Model',
    publisherName: 'BAI-team',
    description:
      'The Invoice package offers a convenient way for contributors to get paid in crypto or fiat',
    selected: true,
    onPublisherClick: () => {},
    onClick: () => {},
  },
} satisfies Meta<typeof PackageCard>

export default meta
type Story = StoryObj<typeof meta>

export const Selected: Story = {}

export const Default: Story = {
  args: {
    selected: false,
  },
}

export const LongDescription: Story = {
  args: {
    name: 'Contributor Billing',
    moduleType: 'Relational Database Processor',
    publisherName: 'MakerDAO',
    description:
      'A comprehensive billing and invoicing solution for DAO contributors that handles multiple currencies, recurring payments, and automated tax reporting across jurisdictions',
    selected: false,
  },
}

export const WithModuleBadge: Story = {
  args: {
    moduleBadgeSlot: (
      <div className="flex flex-col items-center gap-0.5 rounded-lg border border-muted bg-white p-1.5">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="2" width="8" height="8" rx="1" stroke="#ff891d" strokeWidth="1.5" />
          <rect x="14" y="2" width="8" height="8" rx="1" stroke="#ff891d" strokeWidth="1.5" />
          <rect x="2" y="14" width="8" height="8" rx="1" stroke="#ff891d" strokeWidth="1.5" />
          <rect x="14" y="14" width="8" height="8" rx="1" stroke="#ff891d" strokeWidth="1.5" />
        </svg>
        <span className="text-[5px] font-bold text-[#ff891d]">Application</span>
      </div>
    ),
  },
}
