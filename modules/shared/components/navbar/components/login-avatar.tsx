import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar'
import { Button } from '../../ui/button'
import type { User } from '../types'

interface LoginAvatarProps {
  isLoggedIn: boolean
  user?: User
  onLoginClick?: () => void
  onProfileClick?: () => void
}

function LoginAvatar({ isLoggedIn, user, onLoginClick, onProfileClick }: LoginAvatarProps) {
  if (isLoggedIn && user) {
    return (
      <div
        onClick={onProfileClick}
        className="flex cursor-pointer items-center gap-2"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onProfileClick?.()
          }
        }}
      >
        <Avatar>
          <AvatarImage src={user.avatar} alt="avatar" />
          <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <span className="flex text-sm font-medium md:hidden">{user.username}</span>
      </div>
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
