/**
 * Env vars the platform sets on every CLINT pod, sourced by ph-clint's
 * announce module from process.env. The names are reserved — user-supplied
 * env vars must not shadow them.
 *
 * Today the announce URL is a single global value (per processor deploy),
 * not derived per-environment, so we render it as a static informational
 * preview. See spec §9 for the open question.
 */
export const SERVICE_ANNOUNCE_URL_PREVIEW = 'https://switchboard.staging.vetra.io/graphql'

export const RESERVED_ENV_NAMES: readonly string[] = [
  'SERVICE_ANNOUNCE_URL',
  'SERVICE_ANNOUNCE_TOKEN',
  'SERVICE_DOCUMENT_ID',
  'SERVICE_PREFIX',
  'NODE_OPTIONS',
] as const

export function isReservedEnvName(name: string): boolean {
  return RESERVED_ENV_NAMES.includes(name)
}

export type SystemEnvRow = {
  name: string
  preview: string
  helpText?: string
  masked?: boolean
}

/** Compute the read-only preview rows displayed in the modal's System block. */
export function buildSystemEnvPreview({
  environmentId,
  prefix,
}: {
  environmentId: string
  prefix: string
}): SystemEnvRow[] {
  return [
    {
      name: 'SERVICE_ANNOUNCE_URL',
      preview: SERVICE_ANNOUNCE_URL_PREVIEW,
      helpText: 'Where the agent posts its endpoints — set by the platform.',
    },
    {
      name: 'SERVICE_ANNOUNCE_TOKEN',
      preview: '••••••',
      masked: true,
      helpText: 'Minted per-agent on first deploy.',
    },
    {
      name: 'SERVICE_DOCUMENT_ID',
      preview: environmentId,
      helpText: "This environment's document ID.",
    },
    {
      name: 'SERVICE_PREFIX',
      preview: prefix || '<prefix-pending>',
      helpText: 'Distinguishes this agent within the environment.',
    },
  ]
}
