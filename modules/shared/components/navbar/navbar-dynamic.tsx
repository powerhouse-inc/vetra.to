'use client'

import dynamic from 'next/dynamic'

const Navbar = dynamic(() => import('./navbar'), { ssr: false })

export default function NavbarDynamic() {
  return <Navbar />
}
