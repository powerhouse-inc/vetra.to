import VetraIcon from '@/modules/shared/components/svgs/vetra-logo.svg'
import VetraLogoWithText from '@/modules/shared/components/svgs/vetra-logo-with-vetra.svg'
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
      { label: 'Academy', href: 'https://staging.powerhouse.academy', isExternal: true },
      { label: 'Cloud', href: 'https://cloud.vetra.to', isExternal: true },
    ],
    authComponent: 'loginButton',
  },
}

export const getNavbarConfig = (pathname: string): NavbarConfig => {
  return NAVBAR_CONFIGS['/vetra']
}
