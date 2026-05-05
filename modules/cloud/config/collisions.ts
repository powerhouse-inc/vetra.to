import type { ConfigEntry, InstalledManifest } from './types'

/**
 * Map of config key name → list of package names that declare it.
 * Used to surface "also declared by X" hints and to detect exclusive keys.
 */
export function buildCollisionMap(manifests: InstalledManifest[]): Record<string, string[]> {
  const map: Record<string, string[]> = {}
  for (const { packageName, manifest } of manifests) {
    const entries = manifest?.config ?? []
    for (const entry of entries) {
      if (!map[entry.name]) map[entry.name] = []
      if (!map[entry.name].includes(packageName)) {
        map[entry.name].push(packageName)
      }
    }
  }
  return map
}

/**
 * Keys declared by `packageName` that no other installed package declares.
 * Used by the uninstall dialog to pre-check which keys are safe to delete.
 */
export function exclusiveKeys(packageName: string, manifests: InstalledManifest[]): string[] {
  const map = buildCollisionMap(manifests)
  const target = manifests.find((m) => m.packageName === packageName)
  const declared = target?.manifest?.config ?? []
  return declared
    .filter((e) => (map[e.name] ?? []).every((p) => p === packageName))
    .map((e) => e.name)
}

/** Entries from `declared` that aren't present in `existingKeys`. */
export function missingRequiredEntries(
  declared: ConfigEntry[],
  existingVarValues: Record<string, string>,
  existingSecretKeys: Set<string>,
): ConfigEntry[] {
  return declared.filter((e) => {
    if (!e.required) return false
    if (e.type === 'var') return !(e.name in existingVarValues)
    return !existingSecretKeys.has(e.name)
  })
}

/**
 * True when a key name matches the subgraph's naming rule.
 * Shared with the env-var/secret validator in `vetra-cloud-secrets`.
 */
export function isValidConfigKeyName(name: string): boolean {
  return /^[A-Z][A-Z0-9_]*$/.test(name)
}
