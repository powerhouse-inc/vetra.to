'use client'

import { LogIn, Loader2, MoreVertical, User } from 'lucide-react'
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
import { RenownLoginButton } from '../../renown'
import ThemeIconLabel from './toogle-theme-label'

const btnSecondary =
  'bg-accent text-foreground hover:bg-muted inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all cursor-pointer'

function RenownButton() {
  return (
    <RenownLoginButton>
      {(auth) => {
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
            <button type="button" onClick={auth.openProfile} className={btnSecondary}>
              <User className="h-4 w-4" />
              {auth.displayName ?? auth.displayAddress ?? 'Account'}
            </button>
          )
        }
        return (
          <button type="button" onClick={auth.login} className={btnSecondary}>
            <LogIn className="h-4 w-4" />
            Log in
          </button>
        )
      }}
    </RenownLoginButton>
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
