'use client'
import { Check } from 'lucide-react'
import { cn } from '@/modules/shared/lib/utils'

export type StepKey = 'identity' | 'brand' | 'socials' | 'members'
export const STEPS: { key: StepKey; label: string }[] = [
  { key: 'identity', label: 'Identity' },
  { key: 'brand', label: 'Brand' },
  { key: 'socials', label: 'Socials' },
  { key: 'members', label: 'Members' },
]

export function Stepper({ active }: { active: StepKey }) {
  const activeIdx = STEPS.findIndex((s) => s.key === active)
  return (
    <ol className="mb-8 flex flex-wrap items-center gap-2 sm:gap-3">
      {STEPS.map((step, i) => {
        const status = i < activeIdx ? 'done' : i === activeIdx ? 'active' : 'pending'
        return (
          <li key={step.key} className="flex items-center gap-2">
            <span
              className={cn(
                'flex size-7 items-center justify-center rounded-full border text-xs font-semibold transition-colors',
                status === 'done' && 'bg-primary border-primary text-primary-foreground',
                status === 'active' && 'border-primary text-primary',
                status === 'pending' && 'border-muted-foreground/40 text-muted-foreground',
              )}
            >
              {status === 'done' ? <Check className="size-3.5" /> : i + 1}
            </span>
            <span
              className={cn(
                'text-sm font-medium transition-colors',
                status === 'pending' && 'text-muted-foreground',
              )}
            >
              {step.label}
            </span>
            {i < STEPS.length - 1 && (
              <span
                className={cn(
                  'mx-1 hidden h-px w-8 sm:inline-block',
                  status === 'done' ? 'bg-primary' : 'bg-muted-foreground/30',
                )}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
