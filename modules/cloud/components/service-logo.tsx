import { useState } from 'react'
import Image from 'next/image'
import { Globe, Server, Zap } from 'lucide-react'

import type { CloudEnvironmentServiceType } from '@/modules/cloud/types'

type ServiceLogoProps = {
  service: CloudEnvironmentServiceType
  className?: string
  size?: number
}

const SERVICE_LOGO_PATHS: Record<CloudEnvironmentServiceType, string> = {
  CONNECT: '/images/cloud/logos/services/connect.svg',
  SWITCHBOARD: '/images/cloud/logos/services/switchboard.svg',
  FUSION: '/images/cloud/logos/services/fusion.svg',
}

const SERVICE_FALLBACK_ICONS: Record<
  CloudEnvironmentServiceType,
  React.ComponentType<{ className?: string }>
> = {
  CONNECT: Globe,
  SWITCHBOARD: Server,
  FUSION: Zap,
}

export function ServiceLogo({ service, className = '', size = 20 }: ServiceLogoProps) {
  const [imageError, setImageError] = useState(false)
  const logoPath = SERVICE_LOGO_PATHS[service]
  const FallbackIcon = SERVICE_FALLBACK_ICONS[service]

  if (imageError) {
    return <FallbackIcon className={className} style={{ width: size, height: size }} />
  }

  return (
    <Image
      src={logoPath}
      alt={`${service} logo`}
      width={size}
      height={size}
      className={className}
      onError={() => setImageError(true)}
      priority={false}
    />
  )
}