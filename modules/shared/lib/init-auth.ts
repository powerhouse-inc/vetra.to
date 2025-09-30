'use client'

import { initRenown } from '@renown/sdk'
import { BrowserKeyStorage, ConnectCrypto } from './crypto'
import { RENOWN_CHAIN_ID, RENOWN_NETWORK_ID, RENOWN_URL } from './renown/constants'

export async function initializeAuth() {
  if (typeof window === 'undefined') {
    return
  }

  try {
    // Initialize ConnectCrypto with in-memory storage
    const connectCrypto = new ConnectCrypto(new BrowserKeyStorage())

    // Initialize Renown SDK
    const renown = await initRenown(await connectCrypto.did(), RENOWN_NETWORK_ID, RENOWN_URL)

    // Attach to window object
    window.renown = renown
    window.connectCrypto = connectCrypto
  } catch (error) {
    console.error('Failed to initialize auth:', error)
  }
}
