'use client'

import { useRenownAuth } from '@powerhousedao/reactor-browser'
import { LogIn, LogOut, Loader2, MoreVertical, User } from 'lucide-react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { ThemeToggle } from '../../theme-toggle'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu'
import ThemeIconLabel from './toogle-theme-label'

const btnSecondary =
  'bg-accent text-foreground hover:bg-muted inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all cursor-pointer'

function RenownButton() {
  const auth = useRenownAuth()

  if (auth.status === 'loading' || auth.status === 'checking') {
    return (
      <span className={btnSecondary}>
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading
      </span>
    )
  }
  if (auth.status === 'authorized') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className={btnSecondary}>
            <User className="h-4 w-4" />
            {auth.displayName ?? auth.displayAddress ?? 'Account'}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="bg-accent border-border/50 z-170 w-44 rounded-lg p-1.5"
        >
          <DropdownMenuItem
            onClick={auth.openProfile}
            className="cursor-pointer rounded-md px-3 py-2 text-sm font-medium"
          >
            <User className="h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-border/50" />
          <DropdownMenuItem
            onClick={() => auth.logout()}
            className="cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-red-500 focus:text-red-500"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }
  return (
    <button type="button" onClick={auth.login} className={btnSecondary}>
      <LogIn className="h-4 w-4" />
      Log in
    </button>
  )
}

function NavbarRightSide() {
  const { theme, setTheme } = useTheme()

  const handleThemeToggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <>
      <div className="hidden items-center gap-3 md:flex">
        <ThemeToggle />
        <RenownButton />
        <Link
          href="https://gmail.us21.list-manage.com/subscribe/post?u=a65ca7e437961008f5f5c1bad&id=c8ea339c46&f_id=00fda7e6f0"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all hover:-translate-y-px"
        >
          Join Waitlist
        </Link>
      </div>

      <div className="flex items-center md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="text-foreground rounded-md focus:ring-2 focus:ring-offset-2 focus:outline-none"
            >
              <MoreVertical className="h-6 w-6" />
              <span className="sr-only">Open menu</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="z-160 w-56" align="end">
            <DropdownMenuItem className="p-0">
              <RenownButton />
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleThemeToggle} className="cursor-pointer">
              <ThemeIconLabel theme={theme} />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  )
}

export default NavbarRightSide
