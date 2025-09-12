import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import React from 'react'
import { cn } from '@/modules/shared/lib/utils'
import { type NavItem } from '../types'

interface NavbarCenterProps {
  navItems: NavItem[]
  pathname: string
  activeItem?: NavItem
}

function NavbarItemsDesk({ navItems, pathname }: NavbarCenterProps) {
  return (
    <nav className="hidden items-center gap-2 md:flex md:gap-4 lg:gap-12">
      {navItems.map((item) => {
        return (
          <div key={item.label} className="flex items-center gap-1">
            <Link
              href={item.href}
              target={item.isExternal ? '_blank' : '_self'}
              className={cn(
                'text-muted-foreground hover:text-foreground flex items-center gap-1 font-medium',
                pathname === item.href && 'text-foreground',
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
