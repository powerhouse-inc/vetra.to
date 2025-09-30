'use client'

import { useCallback, useEffect, useState } from 'react'
import type { IConnectCrypto } from '../lib/crypto/index'
import type { LoginStatus, User } from '../lib/renown'
import { login, logout, openRenown, handleRenownReturn, fetchEnsDataForUser } from '../lib/renown'
import { SessionStorageManager } from '../lib/session-storage'

/**
 * useUser Hook - Provides Renown authentication functionality
 *
 * This hook manages user authentication state using the Renown SDK.
 * It requires the following to be available on the window object:
 * - window.renown: IRenown instance
 * - window.connectCrypto: IConnectCrypto instance (optional for JWT handling)
 * - window.reactor: Reactor instance (optional for JWT handling)
 *
 * Usage:
 * ```tsx
 * function MyComponent() {
 *   const { user, loginStatus, isLoading, login, logout, openRenown } = useUser()
 *
 *   if (isLoading) return <div>Loading...</div>
 *   if (user) return <div>Welcome {user.did}</div>
 *   return <button onClick={login}>Login</button>
 * }
 * ```
 *
 * Setup requirements:
 * 1. Initialize Renown SDK and attach to window.renown
 * 2. Initialize ConnectCrypto and attach to window.connectCrypto
 * 3. Optionally initialize Reactor and attach to window.reactor
 */

interface UseUserReturn {
  user: User | null
  loginStatus: LoginStatus
  isLoading: boolean
  login: (userDid?: string) => Promise<void>
  logout: () => Promise<void>
  openRenown: () => void
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null)
  const [loginStatus, setLoginStatus] = useState<LoginStatus>('initial')
  const [isLoading, setIsLoading] = useState(false)

  // Initialize user state from sessionStorage or window.renown
  useEffect(() => {
    const initializeUser = async () => {
      // First, check if we have stored user data in sessionStorage
      const storedUserData = SessionStorageManager.getUserData()
      if (storedUserData && SessionStorageManager.isUserDataValid(storedUserData)) {
        // Fetch ENS data for the restored user
        const userWithEns = await fetchEnsDataForUser(storedUserData.user)
        setUser(userWithEns)
        setLoginStatus('authorized')
        setIsLoading(false)
        return
      }

      // If no stored data, proceed with normal initialization
      if (typeof window !== 'undefined' && window.renown && window.connectCrypto) {
        try {
          setIsLoading(true)

          // First, handle any return from Renown authentication
          await handleRenownReturn()

          // Then check for existing user
          let currentUser =
            window.renown.user instanceof Function ? window.renown.user() : window.renown.user
          currentUser = currentUser instanceof Promise ? await currentUser : currentUser

          if (currentUser) {
            // Fetch ENS data for the current user
            const userWithEns = await fetchEnsDataForUser(currentUser)
            setUser(userWithEns)
            setLoginStatus('authorized')
          } else {
            // No current user - set status to not-authorized
            setLoginStatus('not-authorized')
          }
        } catch (error) {
          console.error('Failed to initialize user:', error)
          setLoginStatus('not-authorized')
        } finally {
          setIsLoading(false)
        }
      }
    }

    initializeUser()
  }, [])

  const handleLogin = useCallback(async (userDid?: string) => {
    if (typeof window === 'undefined') return

    const renown = window.renown
    const connectCrypto = window.connectCrypto as IConnectCrypto | undefined

    if (!renown || !connectCrypto) {
      console.error('Renown or ConnectCrypto not available')
      setLoginStatus('not-authorized')
      return
    }

    try {
      setIsLoading(true)
      setLoginStatus('checking')
      const did = userDid || (await connectCrypto.did())

      // Call the login function and get the result
      const loggedInUser = await login(did, renown, connectCrypto)
      if (loggedInUser) {
        // Fetch ENS data and update state
        const userWithEns = await fetchEnsDataForUser(loggedInUser)
        setUser(userWithEns)
        setLoginStatus('authorized')
      } else {
        setLoginStatus('not-authorized')
      }
    } catch (error) {
      console.error('Login failed:', error)
      setLoginStatus('not-authorized')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleLogout = useCallback(async () => {
    await logout()
    setUser(null)
    setLoginStatus('initial')
  }, [])

  const handleOpenRenown = useCallback(async () => {
    await openRenown()
  }, [])

  return {
    user,
    loginStatus,
    isLoading,
    login: handleLogin,
    logout: handleLogout,
    openRenown: handleOpenRenown,
  }
}
