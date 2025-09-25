import type { RouteWithDynamicPages } from '../../types/routes'

type NavItem =
  | {
      label: string
      href: RouteWithDynamicPages
      isExternal: true
    }
  | {
      label: string
      href: RouteWithDynamicPages
      isExternal?: false
      isActive: (currentPath: string) => boolean
    }

interface NavbarProps {
  navItems: NavItem[]
  isLoggedIn?: boolean
}

interface NavbarConfig {
  isotype?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  logotype?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  logotypeClassName?: string
  logoHref?: RouteWithDynamicPages
  navItems: NavItem[]
  authComponent: 'loginButton' | 'avatar' | 'launchButton' | null
  launchButtonText?: string
  launchButtonHref?: string
}

interface User {
  username: string
  avatar: string
}

export type { NavbarConfig, NavItem, NavbarProps, User }
