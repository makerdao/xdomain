import { keccak256 } from 'ethers/lib/utils'

export interface WormholeGUID {
  sourceDomain: string
  targetDomain: string
  receiver: string
  operator: string
  amount: string
  nonce: string
  timestamp: string
}

export function decodeWormholeData(wormholeData: string): WormholeGUID {
  const wormholeGUID = {
    sourceDomain: wormholeData[0],
    targetDomain: wormholeData[1],
    receiver: wormholeData[2],
    operator: wormholeData[3],
    amount: wormholeData[4],
    nonce: wormholeData[5],
    timestamp: wormholeData[6],
  }
  return wormholeGUID
}

export function getGuidHash(wormholeGUID: WormholeGUID): string {
  const wormholeData =
    '0x' +
    Object.values(wormholeGUID)
      .map((hex) => hex.slice(2))
      .join('')
  return keccak256(wormholeData)
}
