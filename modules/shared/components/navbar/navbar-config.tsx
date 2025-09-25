import VetraLogotype from '@/modules/shared/components/svgs/vetra-logo.svg'
import VetraIsoType from '@/modules/shared/components/svgs/vetra.svg'
import type { NavbarConfig } from './types'

export const NAVBAR_CONFIGS: Record<string, NavbarConfig> = {
  '/vetra': {
    isotype: VetraLogotype,
    logotype: VetraIsoType,
    logoHref: '/',
    navItems: [
      {
        label: 'Packages',
        href: '/packages',
        isActive: () => window.location.pathname.includes('/packages'),
      },
      {
        label: 'Builders',
        href: '/builders',
        isActive: () => window.location.pathname.includes('/builders'),
      },
      { label: 'Academy', href: 'https://staging.academy.vetra.to', isExternal: true },
      { label: 'Cloud', href: 'https://cloud.vetra.to', isExternal: true },
    ],
    authComponent: 'loginButton',
  },
}

export const getNavbarConfig = (pathname: string): NavbarConfig => {
  return NAVBAR_CONFIGS['/vetra']
}
