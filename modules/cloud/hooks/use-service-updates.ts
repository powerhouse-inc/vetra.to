'use client'

import { useState, useEffect, useRef } from 'react'

import type { CloudEnvironmentService } from '../types'

export type ServiceUpdate = {
  serviceType: CloudEnvironmentService['type']
  currentVersion: string | null
  latestVersion: string
  channel: string
}

/**
 * Detect which release channel a version belongs to.
 * Strips leading "v" before matching.
 * e.g. "v6.0.0-dev.164" -> "dev", "v5.3.6" -> "latest"
 */
function detectChannel(version: string | null): string {
  if (!version) return 'latest'
  const clean = version.replace(/^v/, '')
  const match = clean.match(/-([a-zA-Z]+)\.?\d*$/)
  return match ? match[1].toLowerCase() : 'latest'
}

export function useServiceUpdates(services: CloudEnvironmentService[]) {
  const [updates, setUpdates] = useState<ServiceUpdate[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const enabledServices = services.filter((s) => s.enabled)
    if (enabledServices.length === 0) {
      setUpdates([])
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setIsLoading(true)

    Promise.all(
      enabledServices.map(async (service) => {
        try {
          const res = await fetch(
            `/api/registry/tags?service=${encodeURIComponent(service.type)}`,
            { signal: controller.signal },
          )
          if (!res.ok) return null

          const data = (await res.json()) as {
            distTags: Record<string, string>
          }
          const distTags = data.distTags ?? {}

          const channel = detectChannel(service.version)
          const channelVersion = distTags[channel]
          if (!channelVersion) return null

          const currentClean = service.version?.replace(/^v/, '') ?? ''
          const latestClean = channelVersion.replace(/^v/, '')
          if (latestClean === currentClean) return null

          return {
            serviceType: service.type,
            currentVersion: service.version,
            latestVersion: channelVersion.startsWith('v') ? channelVersion : `v${channelVersion}`,
            channel,
          } satisfies ServiceUpdate
        } catch {
          return null
        }
      }),
    )
      .then((results) => {
        if (!controller.signal.aborted) {
          setUpdates(results.filter((r): r is ServiceUpdate => r !== null))
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      })

    return () => controller.abort()
  }, [services])

  return { updates, isLoading }
}
