import { useEffect, useState } from 'react'
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'
import { isValidEthAddress } from './validations'

const client = createPublicClient({ chain: mainnet, transport: http() })

export function useEnsResolver(address: string): string | null {
  const [name, setName] = useState<string | null>(null)

  useEffect(() => {
    if (!isValidEthAddress(address)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(null)
      return
    }
    let cancelled = false
    const t = setTimeout(() => {
      client
        .getEnsName({ address: address as `0x${string}` })
        .then((result) => {
          if (!cancelled) setName(result)
        })
        .catch(() => {
          if (!cancelled) setName(null)
        })
    }, 500)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [address])

  return name
}
