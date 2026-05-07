import type { CloudEnvironmentService, CloudResourceSize } from '@/modules/cloud/types'

export type ResourceSpec = {
  requests: { cpu: string; memory: string }
  limits: { cpu: string; memory: string }
}

/**
 * Mirror of vetra-cloud-package/processors/vetra-cloud-environment/gitops.ts
 * APP_RESOURCE_MAP. Kept in sync manually — both halves render the same numbers
 * to the user in the picker and to the cluster in the values YAML.
 */
export const APP_RESOURCE_MAP: Record<CloudResourceSize, ResourceSpec> = {
  VETRA_AGENT_S: {
    requests: { cpu: '250m', memory: '512Mi' },
    limits: { cpu: '1', memory: '1Gi' },
  },
  VETRA_AGENT_M: {
    requests: { cpu: '500m', memory: '1Gi' },
    limits: { cpu: '2', memory: '2Gi' },
  },
  VETRA_AGENT_L: {
    requests: { cpu: '1', memory: '2Gi' },
    limits: { cpu: '4', memory: '4Gi' },
  },
  VETRA_AGENT_XL: {
    requests: { cpu: '2', memory: '4Gi' },
    limits: { cpu: '6', memory: '8Gi' },
  },
  VETRA_AGENT_XXL: {
    requests: { cpu: '4', memory: '8Gi' },
    limits: { cpu: '8', memory: '16Gi' },
  },
}

/** CLINT agents — small-footprint per-pod runtime. */
export const CLINT_RESOURCE_MAP: Record<CloudResourceSize, ResourceSpec> = {
  VETRA_AGENT_S: {
    requests: { cpu: '100m', memory: '256Mi' },
    limits: { cpu: '500m', memory: '512Mi' },
  },
  VETRA_AGENT_M: {
    requests: { cpu: '250m', memory: '512Mi' },
    limits: { cpu: '1', memory: '1Gi' },
  },
  VETRA_AGENT_L: {
    requests: { cpu: '500m', memory: '1Gi' },
    limits: { cpu: '2', memory: '2Gi' },
  },
  VETRA_AGENT_XL: {
    requests: { cpu: '1', memory: '2Gi' },
    limits: { cpu: '4', memory: '4Gi' },
  },
  VETRA_AGENT_XXL: {
    requests: { cpu: '2', memory: '4Gi' },
    limits: { cpu: '8', memory: '8Gi' },
  },
}

export const SIZE_LABELS: Record<CloudResourceSize, string> = {
  VETRA_AGENT_S: 'S',
  VETRA_AGENT_M: 'M',
  VETRA_AGENT_L: 'L',
  VETRA_AGENT_XL: 'XL',
  VETRA_AGENT_XXL: 'XXL',
}

export const ALL_SIZES: CloudResourceSize[] = [
  'VETRA_AGENT_S',
  'VETRA_AGENT_M',
  'VETRA_AGENT_L',
  'VETRA_AGENT_XL',
  'VETRA_AGENT_XXL',
]

/** Parse a Kubernetes CPU quantity ("500m", "1", "2") into a number of cores. */
export function parseK8sCpu(raw: string): number {
  if (raw.endsWith('m')) return parseFloat(raw.slice(0, -1)) / 1000
  return parseFloat(raw)
}

const MEMORY_UNITS: Record<string, number> = {
  Ki: 1024,
  Mi: 1024 ** 2,
  Gi: 1024 ** 3,
  Ti: 1024 ** 4,
  K: 1000,
  M: 1000 ** 2,
  G: 1000 ** 3,
  T: 1000 ** 4,
}

/** Parse a Kubernetes memory quantity ("512Mi", "1Gi") into bytes. */
export function parseK8sMemory(raw: string): number {
  for (const [suffix, mult] of Object.entries(MEMORY_UNITS)) {
    if (raw.endsWith(suffix)) return parseFloat(raw.slice(0, -suffix.length)) * mult
  }
  return parseFloat(raw)
}

/**
 * Resolve a service's per-pod CPU or memory limit.
 *
 * CLINT services use {@link CLINT_RESOURCE_MAP}; everything else
 * ({@link APP_RESOURCE_MAP}). Returns `null` when the service has no resource
 * size selected — caller should render the unbounded chart in that case.
 */
export function getServiceQuota(
  service: Pick<CloudEnvironmentService, 'type' | 'selectedRessource'>,
  kind: 'cpu' | 'memory',
): number | null {
  if (!service.selectedRessource) return null
  const map = service.type === 'CLINT' ? CLINT_RESOURCE_MAP : APP_RESOURCE_MAP
  const spec = map[service.selectedRessource]
  if (!spec) return null
  return kind === 'cpu' ? parseK8sCpu(spec.limits.cpu) : parseK8sMemory(spec.limits.memory)
}
