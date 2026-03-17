'use client'

import { useUser } from '@powerhousedao/reactor-browser'
import { CloudLanding } from '@/modules/cloud/components/cloud-landing'
import { CloudDashboard } from './cloud-dashboard'

export default function CloudPage() {
  const user = useUser()
  const isAuthenticated = !!user

  if (!isAuthenticated) {
    return <CloudLanding />
  }

  return <CloudDashboard />
}
