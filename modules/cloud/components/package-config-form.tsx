'use client'

import { Info, KeyRound, Type } from 'lucide-react'
import type { ConfigEntry, PackageManifest } from '@/modules/cloud/config/types'
import { Badge } from '@/modules/shared/components/ui/badge'
import { Input } from '@/modules/shared/components/ui/input'

export type ConfigFieldState = {
  /** User-entered value (may be empty). */
  value: string
  /** True when the user has touched the field (for "keep existing" secret logic). */
  touched: boolean
}

export type ConfigFormState = Record<string, ConfigFieldState>

export type PackageConfigFormContext = {
  /** Existing env-var values for the tenant, keyed by name. Used for prefill and required-field satisfaction. */
  existingVarValues: Record<string, string>
  /** Existing secret keys for the tenant (values never returned). */
  existingSecretKeys: Set<string>
  /** Package name → list of other package names that also declare each key. Used for collision badges. */
  collisions: Record<string, string[]>
  /** Name of the package owning these entries (excluded from collision labels). */
  ownerPackageName: string
}

export function initialConfigFormState(
  entries: ConfigEntry[],
  ctx: PackageConfigFormContext,
): ConfigFormState {
  const state: ConfigFormState = {}
  for (const entry of entries) {
    if (entry.type === 'var') {
      const existing = ctx.existingVarValues[entry.name]
      state[entry.name] = {
        value: existing ?? entry.default ?? '',
        touched: false,
      }
    } else {
      state[entry.name] = { value: '', touched: false }
    }
  }
  return state
}

/**
 * Validation result for a single form state: which required entries are
 * still unsatisfied. Empty array means the form is valid.
 */
export function validateConfigForm(
  entries: ConfigEntry[],
  state: ConfigFormState,
  ctx: PackageConfigFormContext,
): string[] {
  const missing: string[] = []
  for (const entry of entries) {
    if (!entry.required) continue
    const field = state[entry.name]
    const hasEntered = field && field.value.trim().length > 0
    if (entry.type === 'var') {
      const hasExisting = entry.name in ctx.existingVarValues
      if (!hasEntered && !hasExisting) missing.push(entry.name)
    } else {
      const hasExisting = ctx.existingSecretKeys.has(entry.name)
      if (!hasEntered && !hasExisting) missing.push(entry.name)
    }
  }
  return missing
}

export function PackageConfigForm({
  manifest,
  state,
  onChange,
  ctx,
}: {
  manifest: PackageManifest
  state: ConfigFormState
  onChange: (next: ConfigFormState) => void
  ctx: PackageConfigFormContext
}) {
  const entries = manifest.config ?? []
  if (entries.length === 0) return null

  const required = entries.filter((e) => e.required)
  const optional = entries.filter((e) => !e.required)

  const setField = (name: string, patch: Partial<ConfigFieldState>) => {
    onChange({
      ...state,
      [name]: { ...state[name], ...patch },
    })
  }

  const renderEntry = (entry: ConfigEntry) => {
    const field = state[entry.name] ?? { value: '', touched: false }
    const otherDeclarers = (ctx.collisions[entry.name] ?? []).filter(
      (p) => p !== ctx.ownerPackageName,
    )
    const hasExistingVar = entry.type === 'var' && entry.name in ctx.existingVarValues
    const hasExistingSecret = entry.type === 'secret' && ctx.existingSecretKeys.has(entry.name)
    const Icon = entry.type === 'secret' ? KeyRound : Type
    const placeholder =
      entry.type === 'secret' && hasExistingSecret
        ? '(existing value — leave blank to keep)'
        : entry.default
          ? `default: ${entry.default}`
          : ''

    return (
      <div key={entry.name} className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <Icon className="text-muted-foreground h-3.5 w-3.5" />
          <label htmlFor={`cfg-${entry.name}`} className="font-mono text-xs font-medium">
            {entry.name}
          </label>
          <Badge variant="outline" className="text-[9px]">
            {entry.type}
          </Badge>
          {entry.required && (
            <Badge variant="destructive" className="text-[9px]">
              required
            </Badge>
          )}
          {otherDeclarers.length > 0 && (
            <span className="text-muted-foreground flex items-center gap-1 text-[10px]">
              <Info className="h-3 w-3" />
              also used by {otherDeclarers.join(', ')}
            </span>
          )}
        </div>
        {entry.description && <p className="text-muted-foreground text-xs">{entry.description}</p>}
        <Input
          id={`cfg-${entry.name}`}
          type={entry.type === 'secret' ? 'password' : 'text'}
          autoComplete="off"
          value={field.value}
          placeholder={placeholder}
          onChange={(e) => setField(entry.name, { value: e.target.value, touched: true })}
          className="font-mono text-sm"
        />
        {entry.type === 'var' && hasExistingVar && !field.touched && (
          <p className="text-muted-foreground text-[10px]">
            Existing value loaded. Edit to change.
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {required.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold tracking-wide uppercase">Required</h4>
          {required.map(renderEntry)}
        </div>
      )}
      {optional.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Optional
          </h4>
          {optional.map(renderEntry)}
        </div>
      )}
    </div>
  )
}
