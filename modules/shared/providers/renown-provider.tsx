'use client'

import { UserProvider } from '@renown/sdk'

interface RenownProviderProps {
  children: React.ReactNode
  renownUrl?: string
}

export function RenownProvider({ children, renownUrl }: RenownProviderProps) {
  return (
    <UserProvider
      renownUrl={renownUrl}
      loadingComponent={
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-gray-900"></div>
            <span>Initializing authentication...</span>
          </div>
        </div>
      }
      errorComponent={(error, retry) => (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h2 className="mb-2 text-lg font-semibold text-red-600">
              Authentication Initialization Failed
            </h2>
            <p className="mb-4 text-sm text-gray-600">{error.message}</p>
            <button
              onClick={retry}
              className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    >
      {children}
    </UserProvider>
  )
}
