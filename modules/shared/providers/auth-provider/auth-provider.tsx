'use client'

import { useEffect, useState } from 'react'
import { initializeAuth } from '../../lib/init-auth'

interface AuthProviderProps {
  children: React.ReactNode
}

/**
 * AuthProvider - Initializes authentication before rendering children
 *
 * This provider ensures that window.renown and window.connectCrypto are
 * available before any components that use useUser are rendered.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [initError, setInitError] = useState<Error | null>(null)

  useEffect(() => {
    const init = async () => {
      try {
        await initializeAuth()
        setIsInitialized(true)
      } catch (error) {
        console.error('Failed to initialize authentication:', error)
        setInitError(error as Error)
        // Still set as initialized to prevent infinite loading
        setIsInitialized(true)
      }
    }

    init()
  }, [])

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-gray-900"></div>
          <span>Initializing authentication...</span>
        </div>
      </div>
    )
  }

  // Show error state if initialization failed
  if (initError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-lg font-semibold text-red-600">
            Authentication Initialization Failed
          </h2>
          <p className="mb-4 text-sm text-gray-600">{initError.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
