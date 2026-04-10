'use client'

import { useState, useEffect, useRef } from 'react'
import type { CloudEnvironmentService } from '../types'

export type ServiceUpdate = {
  serviceType: CloudEnvironmentService['type']
  currentVersion: string | null
  latestVersion: string
}

export function useServiceUpdates(services: CloudEnvironmentService[]) {
  const [updates, setUpdates] = useState<ServiceUpdate[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  // Reset updates when no enabled services
  useEffect(() => {
    const enabledServices = services.filter((s) => s.enabled)
    if (enabledServices.length === 0) {
      setUpdates([])
      return
    }
  }, [services])

  useEffect(() => {
    const enabledServices = services.filter((s) => s.enabled)
    if (enabledServices.length === 0) {
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const checkUpdates = async () => {
      setIsLoading(true)
      
      try {
        const results = await Promise.all(
      enabledServices.map(async (service) => {
        try {
          const params = new URLSearchParams({ service: service.type })
          const res = await fetch(`/api/registry/tags?${params}`, {
            signal: controller.signal,
          })
          if (!res.ok) return null

          const data = (await res.json()) as { tags: string[] }
          const tags = data.tags ?? []
          if (tags.length === 0) return null

          // Use the last tag in the list as "latest"
          const latestTag = tags[tags.length - 1]
          if (!latestTag || latestTag === service.version) return null

          return {
            serviceType: service.type,
            currentVersion: service.version,
            latestVersion: latestTag,
          } satisfies ServiceUpdate
        } catch {
          return null
        }
      }),
        )
        
        if (!controller.signal.aborted) {
          setUpdates(results.filter((r): r is ServiceUpdate => r !== null))
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }
    
    void checkUpdates()

    return () => controller.abort()
  }, [services])

  return { updates, isLoading }
}
