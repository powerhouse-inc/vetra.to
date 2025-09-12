'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import AchraLogo from '@/modules/shared/components/svgs/achra-logo.svg'
import NavbarItemMobile from './components/navbar-item-mobile'
import NavbarItemsDesk from './components/navbar-items-desk'
import NavbarRightSide from './components/navbar-right-side'
import { getNavbarConfig } from './navbar-config'

function Navbar() {
  const pathname = usePathname()
  // TODO: get from auth/session state
  const isLoggedIn = false
  const user = {
    username: 'John Doe',
    avatar: 'https://github.com/shadcn.png',
  }
  const handleLoginClick = () => {}

  const config = getNavbarConfig(pathname)

  const { isotype: BrandLogo, logotype: BrandLogotype, navItems } = config
  const activeItem = navItems.find((item) => pathname === item.href)

  return (
    <header className="border2 bg-muted/50 sticky top-0 mx-auto flex max-w-[var(--container-width)] items-center justify-center rounded-3xl backdrop-blur-[7.5px] md:top-1.5 md:p-2.5">
      <div className="bg-card flex flex-1 items-center justify-between rounded-2xl pr-4 md:pr-4">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="text-border bg-primary/5 border-border flex items-center justify-center rounded-l-lg border-r-1 px-4 py-3.5 md:px-6 md:py-4.5">
              <Link href="/">
                <AchraLogo className="h-9 w-9" />
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {BrandLogo && <BrandLogo className="h-8 w-8" />}
                {BrandLogotype && <BrandLogotype className="hidden:md:flex h-8 w-16" />}
              </div>
              <NavbarItemMobile activeItem={activeItem} navItems={navItems} pathname={pathname} />
            </div>
          </div>
          <NavbarItemsDesk navItems={navItems} pathname={pathname} />
          <NavbarRightSide isLoggedIn={isLoggedIn} user={user} onLoginClick={handleLoginClick} />
        </div>
      </div>
    </header>
  )
}
export default Navbar
