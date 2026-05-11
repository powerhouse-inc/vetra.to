'use client'

import { AlertCircle, Loader2, Package as PackageIcon } from 'lucide-react'
import { useMemo } from 'react'

import { ConfigRow } from '@/modules/cloud/components/config-row'
import type { ConfigEntry } from '@/modules/cloud/config/types'
import { useRegistryManifests } from '@/modules/cloud/hooks/use-registry-search'
import { useTenantConfig } from '@/modules/cloud/hooks/use-tenant-config'
import type { CloudEnvironment } from '@/modules/cloud/types'
import { Badge } from '@/modules/shared/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/modules/shared/components/ui/card'
import {
  Table,
  TableBody,
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
