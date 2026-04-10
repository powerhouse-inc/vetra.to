'use client'

import { useState, useEffect, useRef } from 'react'
import type { CloudPackage } from '../types'

export type PackageUpdate = {
  packageName: string
  currentVersion: string | null
  latestVersion: string
  channel: string
}

/**
 * Detect which release channel (dist-tag) a version belongs to.
 * e.g. "1.0.0-dev.1" -> "dev", "1.0.0-staging.2" -> "staging", "1.0.0" -> "latest"
 */
function detectChannel(version: string | null): string {
  if (!version) return 'latest'
  const match = version.match(/-([a-zA-Z]+)\.?\d*$/)
  return match ? match[1] : 'latest'
}

/**
 * Find the best update for a package: prefer the same channel,
 * but also report if there's a newer version on the same channel.
 */
function findUpdate(
  currentVersion: string | null,
  distTags: Record<string, string>,
): { version: string; channel: string } | null {
  const channel = detectChannel(currentVersion)
  const channelVersion = distTags[channel]

  if (channelVersion && channelVersion !== currentVersion) {
    return { version: channelVersion, channel }
  }

  // If on latest channel, nothing else to check
  if (channel === 'latest') return null

  // Also check if latest is newer (but don't auto-suggest cross-channel)
  return null
}

export function usePackageUpdates(packages: CloudPackage[], registryUrl: string | null) {
  const [updates, setUpdates] = useState<PackageUpdate[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!registryUrl || packages.length === 0) {
      setUpdates([])
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setIsLoading(true)

    Promise.all(
      packages.map(async (pkg) => {
        try {
          const params = new URLSearchParams({
            registry: pkg.registry || registryUrl,
            package: pkg.name,
          })
          const res = await fetch(`/api/registry/versions?${params}`, {
            signal: controller.signal,
          })
          if (!res.ok) return null

          const data = (await res.json()) as {
            distTags: Record<string, string>
            versions: string[]
          }

          const update = findUpdate(pkg.version, data.distTags ?? {})
          if (!update) return null

          return {
            packageName: pkg.name,
            currentVersion: pkg.version,
            latestVersion: update.version,
            channel: update.channel,
          } satisfies PackageUpdate
        } catch {
          return null
        }
      }),
    )
      .then((results) => {
        if (!controller.signal.aborted) {
          setUpdates(results.filter((r): r is PackageUpdate => r !== null))
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      })

    return () => controller.abort()
  }, [packages, registryUrl])

  return { updates, isLoading }
}
