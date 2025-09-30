import type { IRenown } from '@renown/sdk'
import type { IConnectCrypto } from '../crypto/index'
import { RENOWN_CHAIN_ID, RENOWN_NETWORK_ID, RENOWN_URL } from './constants'
import { SessionStorageManager } from '../session-storage'
import { extractEthAddressFromDid, extractChainIdFromDid } from './did-parser'
import { getEnsInfo } from './ens'

// Event types for user authentication state
export type LoginStatus = 'initial' | 'checking' | 'authorized' | 'not-authorized'

export interface User {
  did: string
  address: string
  name?: string
  email?: string
  ensName?: string
  ensAvatarUrl?: string
}

// Helper function to fetch ENS data for a user
export async function fetchEnsDataForUser(user: User): Promise<User> {
  try {
    const ethAddress = extractEthAddressFromDid(user.did)
    const chainId = extractChainIdFromDid(user.did)

    if (!ethAddress || !chainId) {
      console.warn('Could not extract ETH address or chain ID from DID:', user.did)
      return user
    }

    const ensInfo = await getEnsInfo(ethAddress, chainId)

    return {
      ...user,
      ensName: ensInfo.name,
      ensAvatarUrl: ensInfo.avatarUrl,
    }
  } catch (error) {
    console.error('Failed to fetch ENS data for user:', error)
    return user
  }
}

// Global types for window extensions
declare global {
  interface Window {
    renown?: IRenown
    reactor?: {
      setGenerateJwtHandler: (handler: (driveUrl: string) => Promise<string>) => void
      removeJwtHandler: () => void
    }
    connectCrypto?: IConnectCrypto
  }
}

export async function openRenown() {
  const url = new URL(RENOWN_URL)

  // Get DID from connectCrypto if available
  let connectDid = ''
  if (window.connectCrypto) {
    try {
      connectDid = await window.connectCrypto.did()
    } catch (error) {
      console.error('Failed to get DID from connectCrypto:', error)
    }
  } else {
    console.warn('connectCrypto not available - authentication may not be properly initialized')
  }

  url.searchParams.set('connect', connectDid)
  url.searchParams.set('network', RENOWN_NETWORK_ID)
  url.searchParams.set('chain', RENOWN_CHAIN_ID)

  const returnUrl = new URL(window.location.pathname, window.location.origin)
  url.searchParams.set('returnUrl', returnUrl.toJSON())
  window.open(url, '_self')?.focus()
}

// Check for return from Renown authentication and handle login
export async function handleRenownReturn() {
  if (typeof window === 'undefined') return

  const urlParams = new URLSearchParams(window.location.search)
  const userDid = decodeURIComponent(urlParams.get('user') ?? '')

  // If we have authentication parameters, attempt login
  if (userDid && window.renown && window.connectCrypto) {
    try {
      await login(userDid, window.renown, window.connectCrypto)
      // Clean up URL parameters
      const cleanUrl = new URL(window.location.href)
      cleanUrl.searchParams.delete('user')
      window.history.replaceState({}, '', cleanUrl.toString())
    } catch (error) {
      console.error('Failed to handle Renown return:', error)
    }
  }
}

export async function login(
  userDid: string | undefined,
  renown: IRenown | undefined,
  connectCrypto: IConnectCrypto | undefined,
) {
  if (!renown || !connectCrypto) {
    return
  }

  // Validate that userDid is a valid pkh DID format
  if (userDid && !userDid.startsWith('did:pkh:')) {
    console.warn('Invalid DID format for login:', userDid, '- expected did:pkh: format')
    return
  }

  try {
    let user = renown.user instanceof Function ? renown.user() : renown.user
    user = user instanceof Promise ? await user : user

    if (user?.did && (user.did === userDid || !userDid)) {
      // Fetch ENS data for the user
      const userWithEns = await fetchEnsDataForUser(user)

      // Set up JWT handler if reactor is available

      // Store user data in sessionStorage for persistence
      SessionStorageManager.setUserData({
        user: userWithEns,
        userDid: userWithEns.did,
        loginStatus: 'authorized',
        timestamp: Date.now(),
      })

      return userWithEns
    }

    if (!userDid) {
      return
    }

    const newUser = await renown.login(userDid ?? '')
    if (newUser) {
      // Fetch ENS data for the user
      const userWithEns = await fetchEnsDataForUser(newUser)

      // Set up JWT handler if reactor is available

      // Store user data in sessionStorage for persistence
      SessionStorageManager.setUserData({
        user: userWithEns,
        userDid: userWithEns.did,
        loginStatus: 'authorized',
        timestamp: Date.now(),
      })

      return userWithEns
    }
  } catch (error) {
    console.error('Renown login error:', error)
    throw error
  }
}

export async function logout() {
  const renown = window.renown
  const reactor = window.reactor

  // Clear sessionStorage data
  SessionStorageManager.clearUserData()

  await renown?.logout()
  reactor?.removeJwtHandler()
}

/**
 * Re-authenticate using stored session data
 * This allows calling renown.login without needing to go through the full auth flow again
 */
export async function reauthenticateFromSession(): Promise<User | null> {
  if (typeof window === 'undefined' || !window.renown || !window.connectCrypto) {
    return null
  }

  const storedUserDid = SessionStorageManager.getStoredUserDid()
  if (!storedUserDid) {
    return null
  }

  try {
    await login(storedUserDid, window.renown, window.connectCrypto)

    // Get the current user after login
    let currentUser =
      window.renown.user instanceof Function ? window.renown.user() : window.renown.user
    currentUser = currentUser instanceof Promise ? await currentUser : currentUser

    if (currentUser) {
      // Fetch ENS data for the restored user
      const userWithEns = await fetchEnsDataForUser(currentUser)
      return userWithEns
    }

    return null
  } catch (error) {
    console.error('Failed to re-authenticate from session:', error)
    return null
  }
}
