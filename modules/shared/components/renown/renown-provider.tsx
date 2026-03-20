'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'

const Renown = dynamic(() => import('@powerhousedao/reactor-browser').then((mod) => mod.Renown), {
  ssr: false,
})

export function RenownProvider({ appName, url }: { appName: string; url?: string }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return <Renown appName={appName} url={url} />
}
