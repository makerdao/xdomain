import { BigNumber } from 'ethers'
import { keccak256 } from 'ethers/lib/utils'

export interface WormholeGUID {
  sourceDomain: string
  targetDomain: string
  receiver: string
  operator: string
  amount: string | BigNumber
  nonce: string | BigNumber
  timestamp: string
}

export function getGuidHash(wormholeGUID: WormholeGUID): string {
  const wormholeData =
    '0x' +
    Object.values(wormholeGUID)
      .map((hex) => hex.slice(2))
      .join('')
  return keccak256(wormholeData)
}
