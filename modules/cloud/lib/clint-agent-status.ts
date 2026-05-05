import type { ClintRuntimeEndpointsForPrefix, Pod } from '@/modules/cloud/types'

export type ClintAgentStatusTone = 'healthy' | 'starting' | 'restarting' | 'failed' | 'stopped'

export type ClintAgentStatus = {
  tone: ClintAgentStatusTone
  label: string
  reason: string
}

export function findClintAgentPods(pods: readonly Pod[], prefix: string): Pod[] {
  // Chart deploys clint with strategy Recreate, so pod names look like
  //   <fullname>-clint-<prefix>-<podhash>
  // where <podhash> is alphanumeric without dashes. Anchor on that
  // terminating hash so longer prefixes (ph-pirate-wouter) don't get
  // matched by a shorter one (ph-pirate). RollingUpdate's two-segment tail
  // (<rs-hash>-<pod-hash>) is also handled.
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // Single trailing dash-free hash. Allowing an optional second segment
  // would let `ph-pirate-wouter-abc` match as if `wouter` were the hash for
  // prefix `ph-pirate`, defeating the disambiguation.
  const re = new RegExp(`-clint-${escaped}-[a-z0-9]+$`)
  return pods.filter((p) => re.test(p.name))
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
