'use client'
import { usePathname } from 'next/navigation'
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
    <header className="sticky top-0 mx-auto flex min-h-9 max-w-[var(--container-width)] items-center justify-center rounded-3xl backdrop-blur-[7.5px] md:top-1.5 md:p-2.5">
      <div className="bg-card flex flex-1 items-center justify-between rounded-2xl px-4 md:px-4">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {BrandLogo && <BrandLogo className="" />}
                {BrandLogotype && <BrandLogotype className="" />}
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
