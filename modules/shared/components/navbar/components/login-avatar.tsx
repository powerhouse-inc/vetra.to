import React from 'react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar'
import { Button } from '../../ui/button'
import type { User } from '../types'

interface LoginAvatarProps {
  isLoggedIn: boolean
  user?: User
  onLoginClick?: () => void
}

function LoginAvatar({ isLoggedIn, user, onLoginClick }: LoginAvatarProps) {
  if (isLoggedIn && user) {
    return (
      <Link
        href={`https://renown-staging.vetra.io/profile/${user.ethAddress || user.username}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <div className="flex items-center gap-2">
          <Avatar className="cursor-pointer">
            <AvatarImage src={user.avatar} alt="avatar" />
            <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="flex text-sm font-medium md:hidden">{user.username}</span>
        </div>
      </Link>
    )
  }

  return (
    <Button
      variant="outline"
      onClick={onLoginClick}
      className="hidden cursor-pointer items-center gap-2 md:flex"
    >
      Log in
    </Button>
  )
}

export default LoginAvatar
