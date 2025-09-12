type NavItem = {
  label: string
  href: string
  isExternal?: boolean
}

interface NavbarProps {
  navItems: NavItem[]
  isLoggedIn?: boolean
}

type NavbarConfig = {
  isotype?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  logotype?: React.ComponentType<React.SVGProps<SVGSVGElement>>
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
