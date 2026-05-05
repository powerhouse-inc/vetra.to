import { describe, expect, it } from 'vitest'
import { deriveClintAgentStatus, findClintAgentPods } from '@/modules/cloud/lib/clint-agent-status'
import type { ClintRuntimeEndpointsForPrefix, Pod } from '@/modules/cloud/types'

const pod = (over: Partial<Pod> = {}): Pod => ({
  name: 'tenant-clint-rupert-7d8c9b6f5abcde',
  service: null,
  phase: 'RUNNING',
  ready: true,
  restartCount: 0,
  updatedAt: '2026-05-05T10:00:00Z',
  ...over,
})

const endpoints = (count: number, lastSeen?: string): ClintRuntimeEndpointsForPrefix => ({
  prefix: 'rupert',
  endpoints: Array.from({ length: count }).map((_, i) => ({
    id: `ep-${i}`,
    type: 'api-graphql' as const,
    port: '8080',
    status: 'enabled' as const,
    lastSeen: lastSeen ?? '2026-05-05T10:00:00Z',
  })),
})

describe('findClintAgentPods', () => {
  it('matches pods by clint-<prefix>- substring in name', () => {
    const pods = [
      pod({ name: 'tenant-clint-rupert-abcxyz' }),
      pod({ name: 'tenant-clint-other-defxyz' }),
      pod({ name: 'tenant-connect-abc' }),
    ]
    const matched = findClintAgentPods(pods, 'rupert')
    expect(matched.map((p) => p.name)).toEqual(['tenant-clint-rupert-abcxyz'])
  })

  it('matches across hyphenated prefixes without partial collisions', () => {
    // Realistic clint pod names: <fullname>-clint-<prefix>-<hash>, hash is
    // a single dash-free alphanumeric segment.
    const pods = [
      pod({ name: 'tenant-clint-ph-pirate-7ddbd67d9c5ps' }),
      pod({ name: 'tenant-clint-ph-pirate-wouter-abc1234567' }),
    ]
    expect(findClintAgentPods(pods, 'ph-pirate').map((p) => p.name)).toEqual([
      'tenant-clint-ph-pirate-7ddbd67d9c5ps',
    ])
    expect(findClintAgentPods(pods, 'ph-pirate-wouter').map((p) => p.name)).toEqual([
      'tenant-clint-ph-pirate-wouter-abc1234567',
    ])
  })
})

describe('deriveClintAgentStatus', () => {
  it('returns "stopped" when there are no pods', () => {
    expect(deriveClintAgentStatus([], null)).toEqual({
      tone: 'stopped',
      label: 'Not running',
      reason: 'No pod scheduled yet',
    })
  })

  it('returns "starting" when pod is pending', () => {
    const status = deriveClintAgentStatus([pod({ phase: 'PENDING', ready: false })], null)
    expect(status.tone).toBe('starting')
    expect(status.label).toMatch(/starting/i)
  })

  it('returns "starting" when running but not ready', () => {
    const status = deriveClintAgentStatus([pod({ phase: 'RUNNING', ready: false })], null)
    expect(status.tone).toBe('starting')
  })

  it('returns "healthy" when running, ready, no restarts, endpoints present', () => {
    const status = deriveClintAgentStatus([pod()], endpoints(3))
    expect(status.tone).toBe('healthy')
    expect(status.label).toMatch(/healthy/i)
  })

  it('returns "healthy" even without endpoints if pod is ready (manifest may declare none)', () => {
    const status = deriveClintAgentStatus([pod()], null)
    expect(status.tone).toBe('healthy')
  })

  it('returns "restarting" when restartCount > 2 even if currently ready', () => {
    const status = deriveClintAgentStatus([pod({ restartCount: 5 })], endpoints(1))
    expect(status.tone).toBe('restarting')
    expect(status.label).toMatch(/restart/i)
    expect(status.reason).toContain('5')
  })

  it('returns "failed" when phase is FAILED', () => {
    const status = deriveClintAgentStatus([pod({ phase: 'FAILED', ready: false })], null)
    expect(status.tone).toBe('failed')
    expect(status.label).toMatch(/failed/i)
  })

  it('treats UNKNOWN phase as failed (kubelet lost contact)', () => {
    const status = deriveClintAgentStatus([pod({ phase: 'UNKNOWN', ready: false })], null)
    expect(status.tone).toBe('failed')
  })

  it('uses the most-recently-updated pod when multiple match (ReplicaSet rollover)', () => {
    const oldPod = pod({ name: 'old', updatedAt: '2026-05-05T09:00:00Z', restartCount: 8 })
    const newPod = pod({ name: 'new', updatedAt: '2026-05-05T10:00:00Z', restartCount: 0 })
    const status = deriveClintAgentStatus([oldPod, newPod], endpoints(1))
    expect(status.tone).toBe('healthy')
  })
})
