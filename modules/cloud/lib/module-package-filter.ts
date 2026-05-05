import type { PackageManifest } from '@/modules/cloud/config/types'
import type { CloudPackage } from '@/modules/cloud/types'

/**
 * Split a package list into "modules" (doc-model packages) and "agents"
 * (clint-project packages) based on manifest type. Packages without a
 * known manifest are treated as modules — failing closed avoids hiding
 * a package the user intentionally installed.
 *
 * TODO: a follow-up could surface clint-project packages with no
 * corresponding CLINT service back in the modules section so users can
 * remove orphans. See spec §6.5.
 */
export function partitionPackagesByManifestType(
  packages: CloudPackage[],
  manifestsByName: Record<string, PackageManifest>,
): { modules: CloudPackage[]; agents: CloudPackage[] } {
  const modules: CloudPackage[] = []
  const agents: CloudPackage[] = []
  for (const p of packages) {
    if (manifestsByName[p.name]?.type === 'clint-project') {
      agents.push(p)
    } else {
      modules.push(p)
    }
  }
  return { modules, agents }
}
