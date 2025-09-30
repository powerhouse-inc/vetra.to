'use client'

import { useUser } from '../../hooks/use-user.js'
import { Button } from '../ui/button.js'

/**
 * Example component demonstrating how to use the useUser hook
 * with Renown authentication
 */
export function UserAuthExample() {
  const { user, loginStatus, isLoading, login, logout, openRenown } = useUser()

  const handleLogin = async () => {
    try {
      await login()
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-gray-900"></div>
        <span>Authenticating...</span>
      </div>
    )
  }

  if (user) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">Welcome back!</h3>
          <p className="text-sm text-gray-600">DID: {user.did}</p>
          <p className="text-sm text-gray-600">Address: {user.address}</p>
          {user.name && <p className="text-sm text-gray-600">Name: {user.name}</p>}
          {user.email && <p className="text-sm text-gray-600">Email: {user.email}</p>}
        </div>
        <Button onClick={handleLogout} variant="outline">
          Logout
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-4">
        <h3 className="font-semibold">Not authenticated</h3>
        <p className="text-sm text-gray-600">Status: {loginStatus}</p>
      </div>
      <div className="flex space-x-2">
        <Button onClick={handleLogin} disabled={isLoading}>
          Login with Renown
        </Button>
        <Button onClick={openRenown} variant="outline" disabled={isLoading}>
          Open Renown Portal
        </Button>
      </div>
    </div>
  )
}
