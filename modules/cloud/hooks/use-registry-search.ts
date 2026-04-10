'use client'

import { useState, useEffect, useRef } from 'react'

type RegistryPackage = {
  name: string
  version: string
  description: string | null
}

type VersionInfo = {
  distTags: Record<string, string>
  versions: string[]
}

export function useRegistryPackages(registryUrl: string | null, search: string) {
  const [packages, setPackages] = useState<RegistryPackage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!registryUrl) {
      setPackages([])
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const timeout = setTimeout(() => {
      const searchPackages = async () => {
        setIsLoading(true)
        try {
          const params = new URLSearchParams({ registry: registryUrl })
          if (search) params.set('search', search)
          const res = await fetch(`/api/registry/packages?${params}`, {
            signal: controller.signal,
          })
          if (res.ok) {
            const data = await res.json() as RegistryPackage[]
            setPackages(data)
          }
        } catch (err) {
          if (err instanceof DOMException && err.name === 'AbortError') return
        } finally {
          setIsLoading(false)
        }
      }
      void searchPackages()
    }, 200)

    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [registryUrl, search])

  return { packages, isLoading }
}

export function useRegistryVersions(registryUrl: string | null, packageName: string | null) {
  const [info, setInfo] = useState<VersionInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Reset info when conditions change
  useEffect(() => {
    if (!registryUrl || !packageName) {
      setInfo(null)
      return
    }
  }, [registryUrl, packageName])

  useEffect(() => {
    if (!registryUrl || !packageName) {
      return
    }

    const controller = new AbortController()
    
    const fetchVersions = async () => {
      setIsLoading(true)
      try {
        const res = await fetch(
          `/api/registry/versions?${new URLSearchParams({ registry: registryUrl, package: packageName })}`,
          { signal: controller.signal },
        )
        if (res.ok) {
          const data = await res.json() as VersionInfo
          setInfo(data)
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
      } finally {
        setIsLoading(false)
      }
    }
    
    void fetchVersions()

    return () => controller.abort()
  }, [registryUrl, packageName])

  return { info, isLoading }
}
