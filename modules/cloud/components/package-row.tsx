'use client'

import { useRenown } from '@powerhousedao/reactor-browser'
import { ArrowUpCircle, MoreHorizontal, Package as PackageIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { applyConfigChanges, type ConfigChange } from '@/modules/cloud/config/apply'
import { exclusiveKeys } from '@/modules/cloud/config/collisions'
import type { ConfigEntry } from '@/modules/cloud/config/types'
import { UpgradePackageModal } from '@/modules/cloud/components/upgrade-package-modal'
import {
  useRegistryManifest,
  useRegistryManifests,
} from '@/modules/cloud/hooks/use-registry-search'
import type { CloudPackage } from '@/modules/cloud/types'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/modules/shared/components/ui/alert-dialog'
import { Badge } from '@/modules/shared/components/ui/badge'
import { Button } from '@/modules/shared/components/ui/button'
import { Checkbox } from '@/modules/shared/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/modules/shared/components/ui/dropdown-menu'
import { TableCell, TableRow } from '@/modules/shared/components/ui/table'

export type PackageRowProps = {
  pkg: CloudPackage
  tenantId: string | null
  registryUrl: string | null
  installedPackages: CloudPackage[]
  onRemove: (name: string) => Promise<void>
  onSetVersion?: (name: string, version: string) => Promise<void>
}

export function PackageRow({
  pkg,
  tenantId,
  registryUrl,
  installedPackages,
  onRemove,
  onSetVersion,
}: PackageRowProps) {
  const [uninstallOpen, setUninstallOpen] = useState(false)
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  return (
    <>
      <TableRow>
        <TableCell>
          <div className="flex items-center gap-2">
            <PackageIcon className="text-muted-foreground h-4 w-4 shrink-0" />
            <span className="font-medium">{pkg.name}</span>
          </div>
        </TableCell>
        <TableCell>
          {pkg.version ? (
            <Badge variant="secondary" className="font-mono text-xs">
              {pkg.version}
            </Badge>
          ) : (
            <span className="text-muted-foreground text-sm">&mdash;</span>
          )}
        </TableCell>
        <TableCell className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onSetVersion && (
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault()
                    setUpgradeOpen(true)
                  }}
                >
                  <ArrowUpCircle className="h-3.5 w-3.5" />
                  Change version...
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                variant="destructive"
                onSelect={(e) => {
                  e.preventDefault()
                  setUninstallOpen(true)
                }}
              >
                Uninstall
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>

      {onSetVersion && (
        <UpgradePackageModal
          registryUrl={registryUrl}
          tenantId={tenantId}
          installedPackages={installedPackages}
          packageName={pkg.name}
          currentVersion={pkg.version ?? null}
          onUpgrade={onSetVersion}
          open={upgradeOpen}
          onOpenChange={setUpgradeOpen}
        />
      )}

      <UninstallDialog
        open={uninstallOpen}
        onOpenChange={setUninstallOpen}
        pkg={pkg}
        tenantId={tenantId}
        registryUrl={registryUrl}
        installedPackages={installedPackages}
        onRemove={onRemove}
      />
    </>
  )
}

function UninstallDialog({
  open,
  onOpenChange,
  pkg,
  tenantId,
  registryUrl,
  installedPackages,
  onRemove,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  pkg: CloudPackage
  tenantId: string | null
  registryUrl: string | null
  installedPackages: CloudPackage[]
  onRemove: (name: string) => Promise<void>
}) {
  const renown = useRenown()
  const [selectedKeys, setSelectedKeys] = useState<Record<string, boolean>>({})
  const [isRemoving, setIsRemoving] = useState(false)

  // Manifest for the package being uninstalled.
  const { manifest: pkgManifest } = useRegistryManifest(
    registryUrl,
    open ? pkg.name : null,
    pkg.version ?? null,
  )

  // All installed manifests (including this one) for collision analysis.
  const packageSpecs = useMemo(
    () => installedPackages.map((p) => ({ name: p.name, version: p.version })),
    [installedPackages],
  )
  const { manifests } = useRegistryManifests(registryUrl, packageSpecs)

  const declaredEntries: ConfigEntry[] = pkgManifest?.config ?? []
  const exclusive = useMemo(
    () => new Set(exclusiveKeys(pkg.name, manifests)),
    [pkg.name, manifests],
  )

  // Pre-check exclusive keys whenever the declared list changes.
  useMemo(() => {
    const initial: Record<string, boolean> = {}
    for (const e of declaredEntries) initial[e.name] = exclusive.has(e.name)
    setSelectedKeys(initial)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [declaredEntries.map((e) => e.name).join(','), exclusive.size])

  const handleConfirm = async () => {
    setIsRemoving(true)
    try {
      if (tenantId) {
        const changes: ConfigChange[] = []
        for (const entry of declaredEntries) {
          if (!selectedKeys[entry.name]) continue
          changes.push(
            entry.type === 'var'
              ? { kind: 'deleteVar', name: entry.name }
              : { kind: 'deleteSecret', name: entry.name },
          )
        }
        if (changes.length > 0) {
          await applyConfigChanges(tenantId, changes, renown)
        }
      }
      await onRemove(pkg.name)
      toast.success(`Uninstalled ${pkg.name}`)
      onOpenChange(false)
    } catch (err) {
      console.error('Failed to uninstall:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to uninstall')
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Uninstall {pkg.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            The package will be removed from this environment.
            {declaredEntries.length > 0 && ' You can also delete its configuration keys:'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {declaredEntries.length > 0 && (
          <div className="space-y-2 py-2">
            {declaredEntries.map((entry) => {
              const isExclusive = exclusive.has(entry.name)
              return (
                <label
                  key={entry.name}
                  className="flex items-center gap-2 text-sm"
                  htmlFor={`uninstall-${entry.name}`}
                >
                  <Checkbox
                    id={`uninstall-${entry.name}`}
                    checked={selectedKeys[entry.name] ?? false}
                    onCheckedChange={(checked) =>
                      setSelectedKeys((prev) => ({
                        ...prev,
                        [entry.name]: checked === true,
                      }))
                    }
                  />
                  <span className="font-mono text-xs">{entry.name}</span>
                  <Badge variant="outline" className="text-[9px]">
                    {entry.type}
                  </Badge>
                  <span className="text-muted-foreground text-[10px]">
                    {isExclusive ? 'exclusive to this package' : 'also used by other packages'}
                  </span>
                </label>
              )
            })}
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isRemoving}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isRemoving ? 'Uninstalling...' : 'Uninstall'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
