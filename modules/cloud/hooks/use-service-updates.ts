'use client'

import { useState, useEffect, useRef } from 'react'
import type { CloudEnvironmentService } from '../types'

export type ServiceUpdate = {
  serviceType: CloudEnvironmentService['type']
  currentVersion: string | null
  latestVersion: string
  channel: string
}

const SERVICE_NPM_PACKAGES: Record<string, string> = {
  CONNECT: '@powerhousedao/connect',
  SWITCHBOARD: '@powerhousedao/switchboard',
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
  return match ? match[1] : 'latest'
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
        const npmPkg = SERVICE_NPM_PACKAGES[service.type]
        if (!npmPkg) return null

        try {
          const res = await fetch(`https://registry.npmjs.org/${npmPkg}`, {
            signal: controller.signal,
          })
          if (!res.ok) return null

          const data = (await res.json()) as {
            'dist-tags': Record<string, string>
          }
          const distTags = data['dist-tags'] ?? {}

          const channel = detectChannel(service.version)
          const channelVersion = distTags[channel]
          if (!channelVersion) return null

          // Compare without v prefix
          const currentClean = service.version?.replace(/^v/, '') ?? ''
          if (channelVersion === currentClean) return null

          return {
            serviceType: service.type,
            currentVersion: service.version,
            latestVersion: `v${channelVersion}`,
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
