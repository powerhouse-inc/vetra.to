import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import React from 'react'
import { cn } from '@/modules/shared/lib/utils'
import type { NavItem } from '../types'

interface NavbarCenterProps {
  navItems: NavItem[]
  pathname: string
  activeItem?: NavItem
}

function NavbarItemsDesk({ navItems, pathname }: NavbarCenterProps) {
  const hasManyItems = navItems.length > 3

  return (
    <nav
      className={cn('hidden items-center gap-2 lg:flex xl:gap-12', {
        'lg:gap-3': hasManyItems,
        'lg:gap-12': !hasManyItems,
      })}
    >
      {navItems.map((item) => {
        return (
          <div key={item.label} className="flex items-center gap-1">
            <Link
              href={item.href}
              target={item.isExternal ? '_blank' : '_self'}
              className={cn(
                'text-foreground/70 hover:text-foreground flex items-center gap-1 text-base font-semibold transition-colors',
                !item.isExternal && item.isActive(pathname) && 'text-foreground',
              )}
            >
              {item.label}
            </Link>
            {item.isExternal && <ExternalLink className="h-4 w-4" />}
          </div>
        )
      })}
    </nav>
  )
}

export default NavbarItemsDesk
