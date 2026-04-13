'use client'

import { createContext, useContext, type ReactNode } from 'react'
import {
  useEnvironmentController,
  type UseEnvironmentControllerResult,
} from '../hooks/use-environment-controller'

const EnvironmentControllerContext = createContext<UseEnvironmentControllerResult | null>(null)

/**
 * Page-level provider that owns the controller for an environment document.
 * All descendants share the same controller instance via context, so
 * mutations dispatched from one tab are reflected everywhere.
 */
export function EnvironmentControllerProvider({
  documentId,
  children,
}: {
  documentId: string
  children: ReactNode
}) {
  const value = useEnvironmentController(documentId)
  return (
    <EnvironmentControllerContext.Provider value={value}>
      {children}
    </EnvironmentControllerContext.Provider>
  )
}

/** Read the controller, state, and loading flags from context. */
export function useEnvironmentControllerContext(): UseEnvironmentControllerResult {
  const ctx = useContext(EnvironmentControllerContext)
  if (!ctx) {
    throw new Error(
      'useEnvironmentControllerContext must be used within an EnvironmentControllerProvider',
    )
  }
  return ctx
}
