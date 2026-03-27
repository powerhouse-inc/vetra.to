import { useState } from 'react'

import type { Meta, StoryObj } from '@storybook/nextjs'

import {
  PackageFilterPanel,
  type FilterSection,
  type PackageFilterPanelProps,
} from './package-filter-panel'

const MOCK_SECTIONS: FilterSection[] = [
  {
    label: 'Results',
    groups: [
      {
        items: [{ id: 'packages', label: 'Packages', count: 8, color: 'gray' }],
      },
      {
        label: 'User Experiences',
        items: [
          { id: 'applications', label: 'Applications', count: 2, color: 'orange' },
          { id: 'editors', label: 'Document Editors', count: 2, color: 'orange' },
        ],
      },
      {
        label: 'Document Models',
        items: [{ id: 'models', label: 'Document Models', count: 2, color: 'red' }],
      },
      {
        label: 'Data Integrations',
        items: [
          { id: 'subgraphs', label: 'Subgraphs', count: 21, color: 'blue' },
          { id: 'processors', label: 'Processors', count: 21, color: 'blue' },
          { id: 'codegenerators', label: 'Codegenerators', count: 21, color: 'blue' },
        ],
      },
    ],
  },
  {
    label: 'Categories',
    groups: [
      {
        items: [
          { id: 'engineering', label: 'Engineering', count: 21, color: 'blue' },
          { id: 'project-management', label: 'Project Management', count: 0, color: 'red' },
          { id: 'governance', label: 'Governance', count: 0, color: 'purple' },
          { id: 'finance', label: 'Finance', count: 13, color: 'orange' },
          { id: 'operation', label: 'Operation', count: 0, color: 'green' },
        ],
      },
    ],
  },
]

const meta = {
  title: 'Packages/PackageFilterPanel',
  component: PackageFilterPanel,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    sections: MOCK_SECTIONS,
    selectedFilters: [],
    searchQuery: '',
    onSearchChange: () => {},
    onFilterToggle: () => {},
    onResetFilters: () => {},
  },
} satisfies Meta<typeof PackageFilterPanel>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithSelectedFilters: Story = {
  args: {
    selectedFilters: ['packages', 'applications', 'editors', 'models', 'subgraphs', 'processors', 'codegenerators', 'finance'],
  },
}

export const WithSearch: Story = {
  args: {
    searchQuery: 'billing',
    selectedFilters: ['finance'],
  },
}

function InteractiveWrapper(props: PackageFilterPanelProps) {
  const [searchQuery, setSearchQuery] = useState(props.searchQuery)
  const [selectedFilters, setSelectedFilters] = useState<string[]>(props.selectedFilters)

  const handleToggle = (id: string) => {
    setSelectedFilters((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id],
    )
  }

  const handleReset = () => {
    setSearchQuery('')
    setSelectedFilters([])
  }

  return (
    <PackageFilterPanel
      sections={props.sections}
      selectedFilters={selectedFilters}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      onFilterToggle={handleToggle}
      onResetFilters={handleReset}
    />
  )
}

export const Interactive: Story = {
  args: {
    selectedFilters: ['packages', 'applications', 'editors', 'models', 'subgraphs', 'processors', 'codegenerators', 'finance'],
  },
  render: (args) => <InteractiveWrapper {...args} />,
}
