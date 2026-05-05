'use client'

import { AlertCircle, KeyRound, Loader2, Package as PackageIcon, Trash2, Type } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import type { ConfigEntry } from '@/modules/cloud/config/types'
import { useRegistryManifests } from '@/modules/cloud/hooks/use-registry-search'
import { useTenantConfig } from '@/modules/cloud/hooks/use-tenant-config'
import type { CloudEnvironment } from '@/modules/cloud/types'
import { Badge } from '@/modules/shared/components/ui/badge'
import { Button } from '@/modules/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/modules/shared/components/ui/card'
import { Input } from '@/modules/shared/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/modules/shared/components/ui/table'

export type ConfigurationTabProps = {
  tenantId: string | null
  environment: CloudEnvironment
}

export function ConfigurationTab({ tenantId, environment }: ConfigurationTabProps) {
  const registryUrl = environment.state.defaultPackageRegistry ?? null
  const installedPackages = environment.state.packages

  const {
    envVars,
    secrets,
    isLoading: tenantLoading,
    setVar,
    setSecret,
    deleteVar,
    deleteSecret,
  } = useTenantConfig(tenantId)

  const packageSpecs = useMemo(
    () => installedPackages.map((p) => ({ name: p.name, version: p.version })),
    [installedPackages],
  )
  const { manifests, isLoading: manifestsLoading } = useRegistryManifests(registryUrl, packageSpecs)

  const existingVarValues = useMemo(() => {
    const out: Record<string, string> = {}
    for (const v of envVars) out[v.key] = v.value
    return out
  }, [envVars])
  const existingSecretKeys = useMemo(() => new Set(secrets.map((s) => s.key)), [secrets])

  const declaredKeyNames = useMemo(() => {
    const set = new Set<string>()
    for (const m of manifests) {
      for (const e of m.manifest?.config ?? []) set.add(e.name)
    }
    return set
  }, [manifests])

  const orphanVars = envVars.filter((v) => !declaredKeyNames.has(v.key))
  const orphanSecrets = secrets.filter((s) => !declaredKeyNames.has(s.key))

  if (!tenantId) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-8 text-center text-sm">
          This environment has no tenant yet. Once the environment is provisioned, configuration
          will be available here.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {manifestsLoading && tenantLoading && (
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          <Loader2 className="h-3 w-3 animate-spin" />
          Loading configuration...
        </div>
      )}

      {installedPackages.length === 0 && (
        <Card>
          <CardContent className="text-muted-foreground py-8 text-center text-sm">
            No packages installed. Install a package on the Overview tab to configure its
            environment variables and secrets.
          </CardContent>
        </Card>
      )}

      {installedPackages.map((pkg) => {
        const manifest = manifests.find((m) => m.packageName === pkg.name)?.manifest ?? null
        return (
          <PackageConfigCard
            key={pkg.name}
            packageName={pkg.name}
            version={pkg.version ?? null}
            entries={manifest?.config ?? []}
            manifestMissing={!manifest}
            existingVarValues={existingVarValues}
            existingSecretKeys={existingSecretKeys}
            onSetVar={setVar}
            onSetSecret={setSecret}
            onDeleteVar={deleteVar}
            onDeleteSecret={deleteSecret}
          />
        )
      })}

      {(orphanVars.length > 0 || orphanSecrets.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-4 w-4" />
              Unused Config
            </CardTitle>
            <p className="text-muted-foreground text-xs">
              Keys that exist in this tenant but are not declared by any installed package.
            </p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead className="w-16 text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {orphanVars.map((v) => (
                  <ConfigRow
                    key={`var-${v.key}`}
                    entry={{ name: v.key, type: 'var' }}
                    currentValue={v.value}
                    isSet={true}
                    onSave={(value) => setVar(v.key, value)}
                    onDelete={() => deleteVar(v.key)}
                  />
                ))}
                {orphanSecrets.map((s) => (
                  <ConfigRow
                    key={`secret-${s.key}`}
                    entry={{ name: s.key, type: 'secret' }}
                    currentValue={null}
                    isSet={true}
                    onSave={(value) => setSecret(s.key, value)}
                    onDelete={() => deleteSecret(s.key)}
                  />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function PackageConfigCard({
  packageName,
  version,
  entries,
  manifestMissing,
  existingVarValues,
  existingSecretKeys,
  onSetVar,
  onSetSecret,
  onDeleteVar,
  onDeleteSecret,
}: {
  packageName: string
  version: string | null
  entries: ConfigEntry[]
  manifestMissing: boolean
  existingVarValues: Record<string, string>
  existingSecretKeys: Set<string>
  onSetVar: (key: string, value: string) => Promise<void>
  onSetSecret: (key: string, value: string) => Promise<void>
  onDeleteVar: (key: string) => Promise<void>
  onDeleteSecret: (key: string) => Promise<void>
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <PackageIcon className="h-4 w-4" />
            {packageName}
          </CardTitle>
          {version && (
            <Badge variant="secondary" className="font-mono text-xs">
              {version}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {manifestMissing ? (
          <p className="text-muted-foreground text-sm italic">
            Could not load this package&rsquo;s manifest.
          </p>
        ) : entries.length === 0 ? (
          <p className="text-muted-foreground text-sm italic">
            This package declares no configuration.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead className="w-16 text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => {
                const isVar = entry.type === 'var'
                const currentValue = isVar ? (existingVarValues[entry.name] ?? null) : null
                const isSet = isVar
                  ? entry.name in existingVarValues
                  : existingSecretKeys.has(entry.name)
                return (
                  <ConfigRow
                    key={entry.name}
                    entry={entry}
                    currentValue={currentValue}
                    isSet={isSet}
                    onSave={(value) =>
                      isVar ? onSetVar(entry.name, value) : onSetSecret(entry.name, value)
                    }
                    onDelete={() => (isVar ? onDeleteVar(entry.name) : onDeleteSecret(entry.name))}
                  />
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

function ConfigRow({
  entry,
  currentValue,
  isSet,
  onSave,
  onDelete,
}: {
  entry: Pick<ConfigEntry, 'name' | 'type' | 'description' | 'required'>
  currentValue: string | null
  isSet: boolean
  onSave: (value: string) => Promise<void>
  onDelete: () => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(currentValue ?? '')
  // Optimistic overlay — set on save, dropped when the parent's data catches
  // up. `null` outside means "use server-reported state". For vars we hold the
  // typed value; for secrets we just remember "set" (the value is never shown).
  const [optimisticDraft, setOptimisticDraft] = useState<string | null>(null)
  const isVar = entry.type === 'var'
  const effectiveIsSet = optimisticDraft !== null ? true : isSet
  const effectiveValue = optimisticDraft !== null && isVar ? optimisticDraft : currentValue
  const Icon = entry.type === 'secret' ? KeyRound : Type

  // Drop the optimistic overlay once the server has caught up.
  useEffect(() => {
    if (optimisticDraft === null) return
    if (isVar && optimisticDraft === currentValue) setOptimisticDraft(null)
    else if (!isVar && isSet) setOptimisticDraft(null)
  }, [optimisticDraft, currentValue, isSet, isVar])

  const handleSave = async () => {
    if (draft.trim().length === 0) {
      toast.error('Value cannot be empty')
      return
    }
    setOptimisticDraft(draft)
    setEditing(false)
    try {
      await onSave(draft)
      toast.success(`Updated ${entry.name}`)
    } catch (err) {
      setOptimisticDraft(null) // revert
      toast.error(err instanceof Error ? err.message : `Failed to update ${entry.name}`)
    }
  }

  const handleDelete = async () => {
    try {
      await onDelete()
      toast.success(`Deleted ${entry.name}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to delete ${entry.name}`)
    }
  }

  const needsValue = entry.required && !effectiveIsSet

  return (
    <TableRow>
      <TableCell className="align-top">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Icon className="text-muted-foreground h-3.5 w-3.5" />
            <span className="font-mono text-sm font-medium">{entry.name}</span>
            {entry.required && (
              <Badge variant="destructive" className="text-[9px]">
                required
              </Badge>
            )}
          </div>
          {entry.description && (
            <p className="text-muted-foreground text-xs">{entry.description}</p>
          )}
        </div>
      </TableCell>
      <TableCell className="align-top">
        <Badge variant="outline" className="text-[9px]">
          {entry.type}
        </Badge>
      </TableCell>
      <TableCell className="align-top">
        {editing ? (
          <div className="flex gap-2">
            <Input
              type={entry.type === 'secret' ? 'password' : 'text'}
              autoComplete="off"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="font-mono text-sm"
              placeholder={entry.type === 'secret' ? 'Enter new value' : ''}
            />
            <Button size="sm" onClick={handleSave}>
              Save
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditing(false)
                setDraft(effectiveValue ?? '')
              }}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {isVar ? (
              effectiveIsSet ? (
                <span className="font-mono text-sm">{effectiveValue}</span>
              ) : (
                <span className="text-muted-foreground text-xs italic">not set</span>
              )
            ) : effectiveIsSet ? (
              <span className="text-muted-foreground text-xs">&bull;&bull;&bull;&bull;&bull;</span>
            ) : (
              <span className="text-muted-foreground text-xs italic">not set</span>
            )}
            {needsValue && (
              <Badge variant="destructive" className="text-[9px]">
                missing
              </Badge>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs"
              onClick={() => {
                setDraft(effectiveValue ?? '')
                setEditing(true)
              }}
            >
              {effectiveIsSet ? 'Edit' : 'Set'}
            </Button>
          </div>
        )}
      </TableCell>
      <TableCell className="text-right align-top">
        {effectiveIsSet && !editing && (
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive h-7 w-7 p-0"
            onClick={handleDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="sr-only">Delete</span>
          </Button>
        )}
      </TableCell>
    </TableRow>
  )
}
