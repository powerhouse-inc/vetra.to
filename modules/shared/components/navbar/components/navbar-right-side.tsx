'use client'

import { MoreVertical } from 'lucide-react'
import { useTheme } from 'next-themes'
import { ThemeToggle } from '../../theme-toggle'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu'
import { RenownLoginButton } from '../../renown-login-button'
import ThemeIconLabel from './toogle-theme-label'

function NavbarRightSide() {
  const { theme, setTheme } = useTheme()

  const handleThemeToggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <>
      <div className="hidden items-center md:flex">
        <ThemeToggle />
        <div className="bg-border mx-4 h-9 w-px" />
        <RenownLoginButton />
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
              <RenownLoginButton />
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
