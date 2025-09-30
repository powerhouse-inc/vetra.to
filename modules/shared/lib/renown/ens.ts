import type { PublicClient } from 'viem'
import { createPublicClient, http } from 'viem'
import { getEnsAvatar, getEnsName } from 'viem/actions'
import type { Chain } from 'viem/chains'
import { mainnet, sepolia, arbitrum, base, optimism } from 'viem/chains'

export type ENSInfo = {
  name?: string
  avatarUrl?: string
}

// Supported chains for ENS resolution
const supportedChains = [mainnet, sepolia, arbitrum, base, optimism]

/**
 * Get chain configuration by ID
 */
export function getChain(id: number): Chain | undefined {
  return supportedChains.find((chain) => chain.id === id)
}

// Create a default client for mainnet
let client: PublicClient = createPublicClient({
  chain: mainnet,
  batch: {
    multicall: true,
  },
  transport: http(),
})

/**
 * Update the client to use a specific chain
 */
function updateChain(chainId: number) {
  if (client.chain?.id === chainId) {
    return
  }

  const chain = getChain(chainId)
  if (!chain) {
    // Default to mainnet if chain is not supported
    console.warn(`Chain ${chainId} not supported for ENS resolution, using mainnet`)
    return
  }

  client = createPublicClient({
    chain,
    batch: {
      multicall: true,
    },
    transport: http(),
  })
}

/**
 * Fetch ENS information (name and avatar) for an Ethereum address
 * @param address - The Ethereum address
 * @param chainId - The chain ID (defaults to mainnet)
 * @returns ENS information including name and avatar URL
 */
export async function getEnsInfo(address: `0x${string}`, chainId: number = 1): Promise<ENSInfo> {
  const result: ENSInfo = {}

  try {
    updateChain(chainId)

    // Try to get ENS name
    const name = await getEnsName(client, { address })
    if (name) {
      result.name = name

      // Try to get avatar URL
      const avatarUrl = await getEnsAvatar(client, { name })
      if (avatarUrl) {
        result.avatarUrl = avatarUrl
      }
    }
  } catch (error) {
    console.error('Failed to fetch ENS info:', error)
  }

  return result
}

/**
 * Fetch only the ENS avatar URL for an address
 * @param address - The Ethereum address
 * @param chainId - The chain ID (defaults to mainnet)
 * @returns Avatar URL or undefined
 */
export async function getEnsAvatarUrl(
  address: `0x${string}`,
  chainId: number = 1,
): Promise<string | undefined> {
  try {
    const ensInfo = await getEnsInfo(address, chainId)
    return ensInfo.avatarUrl
  } catch (error) {
    console.error('Failed to fetch ENS avatar:', error)
    return undefined
  }
}
