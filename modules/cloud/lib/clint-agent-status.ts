import type { ClintRuntimeEndpointsForPrefix, Pod } from '@/modules/cloud/types'

export type ClintAgentStatusTone = 'healthy' | 'starting' | 'restarting' | 'failed' | 'stopped'

export type ClintAgentStatus = {
  tone: ClintAgentStatusTone
  label: string
  reason: string
}

export function findClintAgentPods(pods: readonly Pod[], prefix: string): Pod[] {
  // The chart labels every clint pod with `clint.vetra.io/agent: <prefix>`,
  // surfaced through the observability subgraph as `pod.agent`. Match on
  // that. The previous regex matcher (against pod names of the form
  // `<fullname>-clint-<prefix>-<hash>`) was fragile in two ways:
  //   1) k8s truncates pod names at 63 chars and drops the dash before the
  //      hash, so `…-clint-ph-pirate-cli-agent6ff6x` failed to match.
  //   2) When one agent's prefix was a strict prefix of another's
  //      (e.g. `ph-pirate-cli` vs `ph-pirate-cli-agent`), the shorter
  //      regex falsely matched the longer prefix's pod, especially in the
  //      truncated case.
  // The label is set by the chart and equal to the prefix verbatim, so a
  // simple equality match is both precise and truncation-proof.
  return pods.filter((p) => p.agent === prefix)
}

export function deriveClintAgentStatus(
  pods: readonly Pod[],
  endpoints: ClintRuntimeEndpointsForPrefix | null,
): ClintAgentStatus {
  if (pods.length === 0) {
    return { tone: 'stopped', label: 'Not running', reason: 'No pod scheduled yet' }
  }

  // Latest pod across any ReplicaSet rollovers.
  const pod = [...pods].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]

  if (pod.phase === 'FAILED' || pod.phase === 'UNKNOWN') {
    return {
      tone: 'failed',
      label: 'Failed',
      reason:
        pod.phase === 'UNKNOWN'
          ? 'Kubelet lost contact with the pod'
          : 'Pod terminated with failure',
    }
  }

  if (pod.restartCount > 2) {
    return {
      tone: 'restarting',
      label: 'Restarting',
      reason: `Pod has restarted ${pod.restartCount} time${pod.restartCount === 1 ? '' : 's'}`,
    }
  }

  if (pod.phase === 'PENDING' || !pod.ready) {
    return {
      tone: 'starting',
      label: 'Starting',
      reason: pod.phase === 'PENDING' ? 'Waiting for the pod to schedule' : 'Container not ready',
    }
  }

  const endpointCount = endpoints?.endpoints.length ?? 0
  return {
    tone: 'healthy',
    label: 'Healthy',
    reason:
      endpointCount > 0
        ? `Pod ready, ${endpointCount} endpoint${endpointCount === 1 ? '' : 's'} announced`
        : 'Pod ready',
  }
}
