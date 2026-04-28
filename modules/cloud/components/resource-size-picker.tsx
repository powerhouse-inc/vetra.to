'use client'

import type { CloudResourceSize } from '@/modules/cloud/types'
import { Label } from '@/modules/shared/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/modules/shared/components/ui/radio-group'

const LABELS: Record<CloudResourceSize, string> = {
  VETRA_AGENT_S: 'Small',
  VETRA_AGENT_M: 'Medium',
  VETRA_AGENT_L: 'Large',
  VETRA_AGENT_XL: 'X-Large',
  VETRA_AGENT_XXL: '2X-Large',
}

const ORDER: CloudResourceSize[] = [
  'VETRA_AGENT_S',
  'VETRA_AGENT_M',
  'VETRA_AGENT_L',
  'VETRA_AGENT_XL',
  'VETRA_AGENT_XXL',
]

type Props = {
  supported: CloudResourceSize[]
  value: CloudResourceSize | null
  onChange: (size: CloudResourceSize) => void
  disabled?: boolean
}

export function ResourceSizePicker({ supported, value, onChange, disabled }: Props) {
  const supportedSet = new Set(supported)
  const ordered = ORDER.filter((s) => supportedSet.has(s))
  return (
    <RadioGroup
      value={value ?? undefined}
      onValueChange={(v) => onChange(v as CloudResourceSize)}
      disabled={disabled}
      className="flex flex-wrap gap-3"
    >
      {ordered.map((size) => (
        <div key={size} className="flex items-center gap-2">
          <RadioGroupItem value={size} id={`rs-${size}`} />
          <Label htmlFor={`rs-${size}`}>{LABELS[size]}</Label>
        </div>
      ))}
    </RadioGroup>
  )
}
