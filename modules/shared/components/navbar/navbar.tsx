'use client'

import { usePathname } from 'next/navigation'
import { useMemo } from 'react'
import { cn } from '../../lib/utils'
import { NavbarBrand } from './components/navbar-brand'
import NavbarItemMobile from './components/navbar-item-mobile'
import NavbarItemsDesk from './components/navbar-items-desk'
import NavbarRightSide from './components/navbar-right-side'
import { getNavbarConfig } from './navbar-config'
import { hasBlurBackground } from './utils'

function Navbar() {
  const pathname = usePathname()
  const isLoggedIn = false
  const user = {
    username: 'John Doe',
    avatar: 'https://github.com/shadcn.png',
  }
  const handleLoginClick = () => {}

  const {
    isotype: Isotype,
    logotype: Logotype,
    logotypeClassName,
    logoHref,
    navItems,
  } = useMemo(() => getNavbarConfig(pathname), [pathname])

  const navBarWithBlurBackground = hasBlurBackground(pathname)

  return (
    <div
      className={cn(
        'fixed top-0 right-0 left-0 z-160 h-24 w-full pb-2',
        navBarWithBlurBackground ? 'md:backdrop-blur-[40px]' : 'md:bg-background',
      )}
    >
      <div className="bg-muted/30 fixed top-0 right-0 left-0 z-150 rounded-3xl p-0 shadow-lg md:mx-6 md:p-2.5 md:shadow-none xl:container xl:px-2.5 2xl:mx-14 2xl:max-w-[calc(100%-108px)]">
        <header className="bg-popover flex h-full flex-1 items-center justify-between rounded-none pr-4 md:rounded-2xl">
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-4">
              <NavbarBrand
                isAchraPage={false}
                isotypeLogo={Isotype}
                logotype={Logotype}
                logotypeClassName={logotypeClassName}
                logoHref={logoHref}
              />
              <NavbarItemMobile navItems={navItems} pathname={pathname} />
            </div>

            <NavbarItemsDesk navItems={navItems} pathname={pathname} />

            <NavbarRightSide isLoggedIn={isLoggedIn} user={user} onLoginClick={handleLoginClick} />
          </div>
        </header>
      </div>
    </div>
  )
}

export default Navbar
