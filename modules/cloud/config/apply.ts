import type { ConfigEntry } from './types'
import type { ConfigFormState } from '../components/package-config-form'
import {
  getAuthToken,
  setTenantEnvVar,
  setTenantSecret,
  deleteTenantEnvVar,
  deleteTenantSecret,
} from '../graphql'

type Renown = Parameters<typeof getAuthToken>[0]

export type ConfigChange =
  | { kind: 'setVar'; name: string; value: string }
  | { kind: 'setSecret'; name: string; value: string }
  | { kind: 'deleteVar'; name: string }
  | { kind: 'deleteSecret'; name: string }

/**
 * Apply a batch of config mutations in parallel. Throws the first error
 * encountered (other in-flight mutations continue, but the caller should
 * treat the operation as failed). Idempotent upserts mean partial success
 * is recoverable by retrying.
 */
export async function applyConfigChanges(
  tenantId: string,
  changes: ConfigChange[],
  renown: Renown,
): Promise<void> {
  if (changes.length === 0) return
  const token = await getAuthToken(renown)
  const results = await Promise.allSettled(
    changes.map((c) => {
      switch (c.kind) {
        case 'setVar':
          return setTenantEnvVar(tenantId, c.name, c.value, token)
        case 'setSecret':
          return setTenantSecret(tenantId, c.name, c.value, token)
        case 'deleteVar':
          return deleteTenantEnvVar(tenantId, c.name, token)
        case 'deleteSecret':
          return deleteTenantSecret(tenantId, c.name, token)
      }
    }),
  )
  const failure = results.find((r) => r.status === 'rejected')
  if (failure && failure.status === 'rejected') {
    throw failure.reason instanceof Error ? failure.reason : new Error(String(failure.reason))
  }
}

/**
 * Given a manifest's declared entries and the form state produced by
 * `PackageConfigForm`, produce the list of changes to persist.
 *
 * - Vars are written when the user typed a value different from the existing
 *   one (touched && value differs from existing).
 * - Secrets are written only when the user typed a value (touched). An empty
 *   entered value for an existing secret is ignored (keep existing).
 */
export function computeConfigChanges(
  entries: ConfigEntry[],
  state: ConfigFormState,
  existingVarValues: Record<string, string>,
): ConfigChange[] {
  const out: ConfigChange[] = []
  for (const entry of entries) {
    const field = state[entry.name]
    if (!field) continue
    if (entry.type === 'var') {
      const trimmed = field.value
      const existing = existingVarValues[entry.name]
      if (!field.touched) {
        // Not edited. If var has no existing value and carries a default, persist the default.
        if (existing === undefined && entry.default !== undefined && trimmed === entry.default) {
          out.push({ kind: 'setVar', name: entry.name, value: entry.default })
        }
        continue
      }
      if (trimmed === existing) continue
      out.push({ kind: 'setVar', name: entry.name, value: trimmed })
    } else {
      if (!field.touched) continue
      if (field.value.trim().length === 0) continue
      out.push({ kind: 'setSecret', name: entry.name, value: field.value })
    }
  }
  return out
}
