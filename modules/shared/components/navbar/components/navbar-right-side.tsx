import { UserIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import React from 'react'
import KebabMenu from '@/shared/components/svgs/kebab-menu.svg'
import { ThemeToggle } from '../../theme-toggle'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu'
import LoginAvatar from './login-avatar'
import ThemeIconLabel from './toogle-theme-label'
import type { User } from '../types'

interface NavbarRightSideProps {
  isLoggedIn: boolean
  user?: User
  onLoginClick?: () => void
}

function NavbarRightSide({ isLoggedIn, user, onLoginClick }: NavbarRightSideProps) {
  const { theme, setTheme } = useTheme()

  const handleThemeToggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <>
      <div className="hidden items-center md:flex">
        <ThemeToggle />
        <div className="bg-border mx-4 h-9 w-px" />
        <LoginAvatar isLoggedIn={isLoggedIn} user={user} onLoginClick={onLoginClick} />
      </div>

      <div className="flex items-center md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="text-background rounded-md focus:ring-2 focus:ring-offset-2 focus:outline-none"
            >
              <KebabMenu className="h-9 w-9" />
              <span className="sr-only">Open menu</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="z-160 w-56" align="end">
            {isLoggedIn ? (
              <DropdownMenuItem>
                <LoginAvatar isLoggedIn={isLoggedIn} user={user} />
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={onLoginClick} className="cursor-pointer">
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Login</span>
              </DropdownMenuItem>
            )}
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
