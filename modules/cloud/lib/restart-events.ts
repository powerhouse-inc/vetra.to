import type { KubeEvent } from '@/modules/cloud/types'

const RESTART_REASONS = new Set(['Killing', 'OOMKilling', 'OOMKilled', 'BackOff', 'Failed'])

/** Pull Unix-second timestamps from kube events that indicate a pod restart. */
export function extractRestartTimestamps(events: readonly KubeEvent[]): number[] {
  const out: number[] = []
  for (const e of events) {
    if (!RESTART_REASONS.has(e.reason)) continue
    const t = Date.parse(e.timestamp)
    if (!Number.isNaN(t)) out.push(Math.round(t / 1000))
  }
  return out
}
