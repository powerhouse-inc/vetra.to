'use client'

import dynamic from 'next/dynamic'

const Renown = dynamic(() => import('@powerhousedao/reactor-browser').then((mod) => mod.Renown), {
  ssr: false,
})

export function RenownProvider({ appName, url }: { appName: string; url?: string }) {
  return <Renown appName={appName} url={url} />
}
