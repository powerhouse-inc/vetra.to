import Link from 'next/link'
import React from 'react'
import AchraIsotype from '@/modules/shared/components/svgs/achra-imagotipo.svg'
import AchraLogo from '@/modules/shared/components/svgs/achra-logo.svg'
import { cn } from '@/modules/shared/lib/utils'
import type { RouteWithDynamicPages } from '@/modules/shared/types/routes'

interface NavbarBrandProps {
  isAchraPage: boolean
  isotypeLogo?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  logotype?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  logotypeClassName?: string
  logoHref?: RouteWithDynamicPages
}

export function NavbarBrand({
  isAchraPage,
  isotypeLogo: IsotypeLogo,
  logotype: Logotype,
  logotypeClassName,
  logoHref,
}: NavbarBrandProps) {
  const MainLogoComponent = isAchraPage ? AchraIsotype : AchraLogo
  const showIsotype = !isAchraPage && IsotypeLogo && Logotype
  const logoContainerClasses = cn(
    'text-border flex items-center justify-center overflow-hidden py-4.5',
    {
      'md:rounded-l-2xl border-r bg-primary/5 border-border px-4 md:px-6': !isAchraPage,
      'pl-6': isAchraPage,
    },
  )

  return (
    <div className="flex items-center gap-4 md:gap-6">
      <div className={logoContainerClasses}>
        <a href="/" target="_self" className="cursor-pointer" aria-label="Achra homepage">
          <MainLogoComponent
            className={cn(
              'h-9 sm:flex',
              isAchraPage ? 'text-primary hidden w-42 sm:flex' : 'hover:text-primary/50 w-9',
            )}
          />
          {isAchraPage && <AchraLogo className="text-primary h-9 w-9 sm:hidden" />}
        </a>
      </div>
      {showIsotype && logoHref && (
        <Link href={logoHref} className="cursor-pointer hover:opacity-80">
          <div className="flex items-center gap-2">
            {typeof IsotypeLogo === 'function' && <IsotypeLogo className="h-8 w-8" />}
            {typeof Logotype === 'function' && (
              <Logotype className={cn('hidden h-8 md:flex', logotypeClassName)} />
            )}
          </div>
        </Link>
      )}
    </div>
  )
}
