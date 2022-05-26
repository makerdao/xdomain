import { keccak256 } from 'ethers/lib/utils'

export interface TeleportGUID {
  sourceDomain: string
  targetDomain: string
  receiver: string
  operator: string
  amount: string
  nonce: string
  timestamp: string
}

export function decodeTeleportData(teleportData: string): TeleportGUID {
  const splitData =
    teleportData
      .replace('0x', '')
      .match(/.{64}/g)
      ?.map((hex: string) => `0x${hex}`) || []
  const teleportGUID = {
    sourceDomain: splitData[0],
    targetDomain: splitData[1],
    receiver: splitData[2],
    operator: splitData[3],
    amount: splitData[4],
    nonce: splitData[5],
    timestamp: splitData[6],
  }
  return teleportGUID
}

export function getGuidHash(teleportGUID: TeleportGUID): string {
  const teleportData =
    '0x' +
    Object.values(teleportGUID)
      .map((hex) => hex.slice(2))
      .join('')
  return keccak256(teleportData)
}
