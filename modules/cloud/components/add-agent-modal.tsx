'use client'

import { Bot, Loader2 } from 'lucide-react'
import { useMemo, useState } from 'react'

import { isAgentPackageName, validateAgentManifest } from '@/modules/cloud/lib/agent-discovery'
import { useRegistryManifest, useRegistryPackages } from '@/modules/cloud/hooks/use-registry-search'
import type { CloudEnvironment, CloudPackage, CloudServiceClintConfig } from '@/modules/cloud/types'
import { Button } from '@/modules/shared/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/modules/shared/components/ui/command'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/modules/shared/components/ui/dialog'

export type AddAgentSubmitPayload = {
  packageName: string
  version: string | undefined
  prefix: string
  clintConfig: CloudServiceClintConfig
}

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  env: CloudEnvironment
  registryUrl: string | null
  tenantId: string | null
  installedPackages: CloudPackage[]
  onSubmit: (payload: AddAgentSubmitPayload) => Promise<void>
  /** Optional initial selection — used in tests / deep-links. */
  defaultSelectedPackage?: string
}

export function AddAgentModal({
  open,
  onOpenChange,
  registryUrl,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  env: _env,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  tenantId: _tenantId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  installedPackages: _installedPackages,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onSubmit: _onSubmit,
  defaultSelectedPackage,
}: Props) {
  const [search, setSearch] = useState('')
  const [selectedPackage, setSelectedPackage] = useState<string | null>(
    defaultSelectedPackage ?? null,
  )

  const { packages, isLoading: packagesLoading } = useRegistryPackages(registryUrl, search)
  const agentPackages = useMemo(
    () => packages.filter((p) => isAgentPackageName(p.name)),
    [packages],
  )

  const { manifest, isLoading: manifestLoading } = useRegistryManifest(
    registryUrl,
    selectedPackage,
    null, // version selected later in B.5
  )
  const validation = useMemo(
    () => (selectedPackage ? validateAgentManifest(manifest) : null),
    [selectedPackage, manifest],
  )
  const agentInfo =
    validation?.ok && validation.manifest.features?.agent
      ? validation.manifest.features.agent
      : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Agent</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Pick an agent</label>
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Search agents (packages ending in -cli)…"
                value={search}
                onValueChange={setSearch}
              />
              <CommandList>
                {packagesLoading && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
                  </div>
                )}
                {!packagesLoading && agentPackages.length === 0 && (
                  <CommandEmpty>
                    {registryUrl ? 'No agents found.' : 'No registry configured.'}
                  </CommandEmpty>
                )}
                <CommandGroup>
                  {agentPackages.map((pkg) => (
                    <CommandItem
                      key={pkg.name}
                      value={pkg.name}
                      onSelect={() => setSelectedPackage(pkg.name)}
                    >
                      <Bot className="text-muted-foreground mr-2 h-4 w-4" />
                      <div className="flex flex-col">
                        <span className="font-medium">{pkg.name}</span>
                        <span className="text-muted-foreground text-xs">latest: {pkg.version}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </div>
          {selectedPackage && manifestLoading && (
            <div className="text-muted-foreground flex items-center gap-2 text-xs">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading manifest…
            </div>
          )}
          {validation && !validation.ok && validation.reason === 'not-clint' && (
            <p className="text-destructive text-xs">
              {"This package isn't a Powerhouse agent. Pick another or contact the package author."}
            </p>
          )}
          {agentInfo && (
            <div className="bg-muted/40 flex items-start gap-3 rounded-md border p-3">
              <div className="bg-muted flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md">
                {agentInfo.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={agentInfo.image}
                    alt={agentInfo.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Bot className="text-muted-foreground h-6 w-6" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{agentInfo.name}</div>
                {agentInfo.description && (
                  <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                    {agentInfo.description}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled>Install agent</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
