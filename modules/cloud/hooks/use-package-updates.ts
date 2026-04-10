'use client'

import { useState, useEffect, useRef } from 'react'
import type { CloudPackage } from '../types'

export type PackageUpdate = {
  packageName: string
  currentVersion: string | null
  latestVersion: string
}

export function usePackageUpdates(packages: CloudPackage[], registryUrl: string | null) {
  const [updates, setUpdates] = useState<PackageUpdate[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  // Reset updates when conditions change
  useEffect(() => {
    if (!registryUrl || packages.length === 0) {
      setUpdates([])
      return
    }
  }, [registryUrl, packages.length])

  useEffect(() => {
    if (!registryUrl || packages.length === 0) {
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const checkUpdates = async () => {
      setIsLoading(true)
      
      try {
        const results = await Promise.all(
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
          const latestVersion = data.distTags?.latest
          if (!latestVersion || latestVersion === pkg.version) return null

          return {
            packageName: pkg.name,
            currentVersion: pkg.version,
            latestVersion,
          } satisfies PackageUpdate
        } catch {
          return null
        }
      }),
        )
        
        if (!controller.signal.aborted) {
          setUpdates(results.filter((r): r is PackageUpdate => r !== null))
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }
    
    void checkUpdates()

    return () => controller.abort()
  }, [packages, registryUrl])

  return { updates, isLoading }
}
