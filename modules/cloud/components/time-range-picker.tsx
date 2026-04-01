'use client'

import { ChevronDown } from 'lucide-react'

import type { MetricRange } from '@/modules/cloud/types'
import { Button } from '@/modules/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/modules/shared/components/ui/dropdown-menu'

const RANGE_LABELS: Record<MetricRange, string> = {
  ONE_MIN: '1m',
  FIVE_MIN: '5m',
  FIFTEEN_MIN: '15m',
  ONE_HOUR: '1h',
  SIX_HOURS: '6h',
  TWENTY_FOUR_HOURS: '24h',
}

const ALL_RANGES: MetricRange[] = [
  'ONE_MIN',
  'FIVE_MIN',
  'FIFTEEN_MIN',
  'ONE_HOUR',
  'SIX_HOURS',
  'TWENTY_FOUR_HOURS',
]

type TimeRangePickerProps = {
  value: MetricRange
  onChange: (range: MetricRange) => void
  options?: MetricRange[]
}

export function TimeRangePicker({ value, onChange, options = ALL_RANGES }: TimeRangePickerProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-1.5">
          {RANGE_LABELS[value]}
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {options.map((range) => (
          <DropdownMenuItem
            key={range}
            onClick={() => onChange(range)}
            className={value === range ? 'bg-accent' : undefined}
          >
            {RANGE_LABELS[range]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
