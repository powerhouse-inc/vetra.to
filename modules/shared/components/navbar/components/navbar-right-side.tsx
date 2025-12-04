'use client'

import { RenownLoginButton, RenownUserButton, useUser } from '@renown/sdk'
import { MoreVertical } from 'lucide-react'
import { useTheme } from 'next-themes'
import React from 'react'
import { ThemeToggle } from '../../theme-toggle'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu'
import ThemeIconLabel from './toogle-theme-label'

function NavbarRightSide() {
  const { theme, setTheme } = useTheme()
  const { user, openRenown, logout } = useUser()

  const handleThemeToggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const profileUrl = user?.ethAddress
    ? `https://www.renown.id/profile/${user.ethAddress}`
    : 'https://www.renown.id'

  return (
    <>
      <div className="hidden items-center md:flex">
        <ThemeToggle />
        <div className="bg-border mx-4 h-9 w-px" />
        {user ? (
          <RenownUserButton
            address={user.ethAddress || user.did}
            username={user.name}
            avatarUrl={user.avatar}
            profileUrl={profileUrl}
            onDisconnect={logout}
          />
        ) : (
          <RenownLoginButton onLogin={openRenown} />
        )}
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
              {user ? (
                <RenownUserButton
                  address={user.ethAddress || user.did}
                  username={user.name}
                  avatarUrl={user.avatar}
                  profileUrl={profileUrl}
                  onDisconnect={logout}
                />
              ) : (
                <RenownLoginButton onLogin={openRenown} />
              )}
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
