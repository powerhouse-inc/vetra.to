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
      void (async () => {
        setIsLoading(true)
        try {
          const params = new URLSearchParams({ registry: registryUrl })
          if (search) params.set('search', search)
          const res = await fetch(`/api/registry/packages?${params}`, {
            signal: controller.signal,
          })
          if (res.ok) {
            setPackages((await res.json()) as RegistryPackage[])
          }
        } catch (err) {
          if (err instanceof DOMException && err.name === 'AbortError') return
        } finally {
          setIsLoading(false)
        }
      })()
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

  useEffect(() => {
    if (!registryUrl || !packageName) {
      setInfo(null)
      return
    }

    const controller = new AbortController()
    setIsLoading(true)

    fetch(
      `/api/registry/versions?${new URLSearchParams({ registry: registryUrl, package: packageName })}`,
      { signal: controller.signal },
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setInfo(data)
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))

    return () => controller.abort()
  }, [registryUrl, packageName])

  return { info, isLoading }
}
