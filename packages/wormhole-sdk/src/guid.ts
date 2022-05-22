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
  const splitData =
    wormholeData
      .replace('0x', '')
      .match(/.{64}/g)
      ?.map((hex: string) => `0x${hex}`) || []
  const wormholeGUID = {
    sourceDomain: splitData[0],
    targetDomain: splitData[1],
    receiver: splitData[2],
    operator: splitData[3],
    amount: splitData[4],
    nonce: splitData[5],
    timestamp: splitData[6],
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
