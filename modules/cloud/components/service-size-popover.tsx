'use client'

import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { ResourceSizePicker } from '@/modules/cloud/components/resource-size-picker'
import {
  ALL_SIZES,
  APP_RESOURCE_MAP,
  CLINT_RESOURCE_MAP,
  SIZE_LABELS,
  type ResourceSpec,
} from '@/modules/cloud/lib/resource-maps'
import type { CloudEnvironmentServiceType, CloudResourceSize } from '@/modules/cloud/types'
import { Button } from '@/modules/shared/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shared/components/ui/popover'
import { cn } from '@/shared/lib/utils'

type Props = {
  serviceType: CloudEnvironmentServiceType
  prefix: string
  currentSize: CloudResourceSize | null
  canEdit: boolean
  onSave: (size: CloudResourceSize) => Promise<void>
}

export function ServiceSizePopover({ serviceType, prefix, currentSize, canEdit, onSave }: Props) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState<CloudResourceSize | null>(null)
  const map = serviceType === 'CLINT' ? CLINT_RESOURCE_MAP : APP_RESOURCE_MAP
  const effective: CloudResourceSize = currentSize ?? 'VETRA_AGENT_S'
  const display = pending ?? effective

  const handleChange = async (size: CloudResourceSize) => {
    if (size === effective) {
      setOpen(false)
      return
    }
    setPending(size)
    try {
      await onSave(size)
      toast.success(`Resized ${prefix} to ${SIZE_LABELS[size]}`)
      setOpen(false)
    } catch (err) {
      setPending(null)
      toast.error(err instanceof Error ? err.message : 'Failed to resize service')
    }
  }

  if (!canEdit) {
    return (
      <span className="text-muted-foreground text-xs font-medium">
        Size: {SIZE_LABELS[effective]}
      </span>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
          Size: {SIZE_LABELS[display]}
          <ChevronDown className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 space-y-3">
        <ResourceSizePicker supported={ALL_SIZES} value={display} onChange={handleChange} />
        <ResourceTable map={map} highlight={display} />
        <p className="text-muted-foreground text-[11px] leading-snug">
          Saving moves the environment to <code className="font-mono">CHANGES_PENDING</code>.
          Approve from the Overview tab to deploy.
        </p>
      </PopoverContent>
    </Popover>
  )
}

function ResourceTable({
  map,
  highlight,
}: {
  map: Record<CloudResourceSize, ResourceSpec>
  highlight: CloudResourceSize
}) {
  return (
    <div className="overflow-hidden rounded border">
      <table className="w-full text-[11px]">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-2 py-1 text-left font-medium">Size</th>
            <th className="px-2 py-1 text-left font-medium">Requests</th>
            <th className="px-2 py-1 text-left font-medium">Limits</th>
          </tr>
        </thead>
        <tbody>
          {ALL_SIZES.map((s) => {
            const r = map[s]
            const isCurrent = s === highlight
            return (
              <tr key={s} className={cn('font-mono', isCurrent && 'bg-accent')}>
                <td className="px-2 py-1">{SIZE_LABELS[s]}</td>
                <td className="px-2 py-1">
                  {r.requests.cpu} / {r.requests.memory}
                </td>
                <td className="px-2 py-1">
                  {r.limits.cpu} / {r.limits.memory}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
