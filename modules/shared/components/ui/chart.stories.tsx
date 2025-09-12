import React from 'react'
import * as Recharts from 'recharts'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from './chart'
import type { Meta, StoryObj } from '@storybook/nextjs'

const meta = {
  title: 'Shared/Shadcn/Chart',
  component: ChartContainer,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof ChartContainer>

export default meta
type Story = StoryObj<typeof meta>

const data = [
  { month: 'Jan', value: 400 },
  { month: 'Feb', value: 300 },
  { month: 'Mar', value: 200 },
  { month: 'Apr', value: 278 },
  { month: 'May', value: 189 },
]

export const Line: Story = {
  args: {
    children: <div />,
    config: { value: { label: 'Revenue', color: 'hsl(var(--primary))' } },
  },
  render: () => (
    <div style={{ width: 520 }}>
      <ChartContainer config={{ value: { label: 'Revenue', color: 'hsl(var(--primary))' } }}>
        <Recharts.LineChart data={data}>
          <Recharts.CartesianGrid strokeDasharray="3 3" />
          <Recharts.XAxis dataKey="month" />
          <Recharts.YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Recharts.Line type="monotone" dataKey="value" stroke="var(--color-value)" />
          <ChartLegend content={<ChartLegendContent />} />
        </Recharts.LineChart>
      </ChartContainer>
    </div>
  ),
}
