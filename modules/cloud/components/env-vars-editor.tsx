'use client'

import { Plus, Trash2 } from 'lucide-react'
import type { CloudServiceEnv } from '@/modules/cloud/types'
import { Button } from '@/modules/shared/components/ui/button'
import { Input } from '@/modules/shared/components/ui/input'

type Props = {
  value: CloudServiceEnv[]
  onChange: (next: CloudServiceEnv[]) => void
  disabled?: boolean
}

export function EnvVarsEditor({ value, onChange, disabled }: Props) {
  const update = (idx: number, patch: Partial<CloudServiceEnv>) => {
    onChange(value.map((row, i) => (i === idx ? { ...row, ...patch } : row)))
  }
  const remove = (idx: number) => onChange(value.filter((_, i) => i !== idx))
  const add = () => onChange([...value, { name: '', value: '' }])
  return (
    <div className="space-y-2">
      {value.map((row, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <Input
            aria-label={`env-name-${idx}`}
            placeholder="NAME"
            value={row.name}
            onChange={(e) => update(idx, { name: e.target.value })}
            disabled={disabled}
            className="font-mono text-sm"
          />
          <Input
            aria-label={`env-value-${idx}`}
            placeholder="value"
            value={row.value}
            onChange={(e) => update(idx, { value: e.target.value })}
            disabled={disabled}
            className="font-mono text-sm"
          />
          <Button
            variant="ghost"
            size="icon"
            type="button"
            aria-label="remove env var"
            onClick={() => remove(idx)}
            disabled={disabled}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        type="button"
        onClick={add}
        disabled={disabled}
        className="gap-1.5"
      >
        <Plus className="h-3.5 w-3.5" /> Add env var
      </Button>
    </div>
  )
}
