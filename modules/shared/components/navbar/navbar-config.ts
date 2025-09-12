import PowerhouseLogo from '@/modules/shared/components/svgs/powerhouse.svg'
import SkyIsotype from '@/modules/shared/components/svgs/sky-isotype.svg'
import SkyLogotype from '@/modules/shared/components/svgs/sky-logotype.svg'
import type { NavbarConfig } from './types'

export const NAVBAR_CONFIGS: Record<string, NavbarConfig> = {
  '/sky': {
    isotype: SkyIsotype,
    logotype: SkyLogotype,
    navItems: [
      { label: 'Contributors', href: '/contributors' },
      { label: 'Roadmap', href: '/roadmap' },
      { label: 'Finances', href: '/finances' },
      { label: 'Builders', href: '/builders' },
      { label: 'Governance', href: 'https://governance.achra.network', isExternal: true },
    ],
    authComponent: 'loginButton',
  },
  '/powerhouse': {
    isotype: PowerhouseLogo,
    logotype: PowerhouseLogo,
    navItems: [
      { label: 'Example1', href: '/example' },
      { label: 'Example2', href: '/example' },
      { label: 'Example3', href: '/example' },
    ],
    authComponent: 'loginButton',
  },
}

export const getNavbarConfig = (pathname: string): NavbarConfig => {
  if (pathname.startsWith('/sky')) {
    return NAVBAR_CONFIGS['/sky']
  }
  if (pathname.startsWith('/powerhouse')) {
    return NAVBAR_CONFIGS['/powerhouse']
  }
  return NAVBAR_CONFIGS['/sky']
}
