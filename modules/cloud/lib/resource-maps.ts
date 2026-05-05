import type { CloudResourceSize } from '@/modules/cloud/types'

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
