import VetraLogoWithText from '@/modules/shared/components/svgs/vetra-logo-with-vetra.svg'
import VetraIcon from '@/modules/shared/components/svgs/vetra-logo.svg'
import type { NavbarConfig } from './types'

export const NAVBAR_CONFIGS: Record<string, NavbarConfig> = {
  '/vetra': {
    isotype: VetraIcon,
    logotype: VetraLogoWithText,
    logoHref: '/',
    navItems: [
      {
        label: 'Packages',
        href: '/packages',
        isActive: (currentPath) => currentPath.includes('/packages'),
      },
      {
        label: 'Builders',
        href: '/builders',
        isActive: (currentPath) => currentPath.includes('/builders'),
      },
      { label: 'Academy', href: 'https://academy.vetra.io/', isExternal: true },
      { label: 'Cloud', href: '/cloud', isActive: (currentPath) => currentPath.includes('/cloud') },
    ],
    authComponent: 'loginButton',
  },
}

export const getNavbarConfig = (pathname: string): NavbarConfig => {
  return NAVBAR_CONFIGS['/vetra']
}
