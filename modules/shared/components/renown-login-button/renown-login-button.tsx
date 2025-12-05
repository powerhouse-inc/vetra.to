'use client'

import { useUser } from '@renown/sdk'
import { LogIn, LogOut, User, ChevronDown } from 'lucide-react'
import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'
import { cn } from '../../lib/utils'

interface RenownLoginButtonProps {
  className?: string
}

export function RenownLoginButton({ className = '' }: RenownLoginButtonProps) {
  const { user, isLoading, openRenown, logout } = useUser()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    setIsDropdownOpen(false)
    await logout()
  }

  const handleViewProfile = () => {
    setIsDropdownOpen(false)
    if (user?.documentId) {
      window.open(`https://www.renown.id/profile/${user.documentId}`, '_blank')
    } else if (user?.ethAddress) {
      window.open(`https://www.renown.id/profile/${user.ethAddress}`, '_blank')
    }
  }

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  if (isLoading) {
    return (
      <div
        className={cn('bg-muted flex h-10 items-center justify-center rounded-lg px-4', className)}
      >
        <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return (
      <button
        onClick={openRenown}
        className={cn(
          'border-border bg-background hover:bg-muted flex h-10 cursor-pointer items-center gap-2 rounded-lg border px-4 font-semibold transition-colors',
          className,
        )}
      >
        <LogIn className="h-[18px] w-[18px]" />
        Login
      </button>
    )
  }

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="bg-muted hover:bg-muted/80 flex h-10 cursor-pointer items-center gap-2 rounded-lg px-3 transition-colors"
      >
        {user.avatar ? (
          <Image
            src={user.avatar}
            alt={user.name || user.ethAddress || 'User'}
            width={24}
            height={24}
            className="rounded-full"
          />
        ) : (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500">
            <span className="text-xs font-bold text-white">
              {(user.name || user.ethAddress || 'U')[0].toUpperCase()}
            </span>
          </div>
        )}
        <span className="text-foreground font-medium">
          {user.name || truncateAddress(user.ethAddress || user.did || '')}
        </span>
        <ChevronDown
          className={cn(
            'text-muted-foreground h-4 w-4 transition-transform',
            isDropdownOpen && 'rotate-180',
          )}
        />
      </button>

      {isDropdownOpen && (
        <div className="bg-popover border-border absolute top-12 right-0 z-50 w-48 overflow-hidden rounded-lg border shadow-xl">
          <div className="border-border border-b px-4 py-3">
            <p className="text-foreground text-sm font-medium">{user.name || 'Anonymous'}</p>
            <p className="text-muted-foreground text-xs">
              {truncateAddress(user.ethAddress || user.did || '')}
            </p>
          </div>
          <div className="py-1">
            <button
              onClick={handleViewProfile}
              className="text-foreground hover:bg-muted flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left text-sm transition-colors"
            >
              <User className="h-4 w-4" />
              View Profile
            </button>
            <button
              onClick={handleLogout}
              className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left text-sm text-red-500 transition-colors hover:bg-red-500/10"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default RenownLoginButton
