import { providers } from 'ethers'
import { keccak256 } from 'ethers/lib/utils'

import { TeleportOutboundGatewayInterface } from './sdk/esm/types/TeleportOutboundGateway.d'
import { waitForTxReceipt } from './utils'

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

export async function getTeleportGuid(
  txHash: string,
  srcDomainProvider: providers.Provider,
  teleportOutboundGatewayInterface: TeleportOutboundGatewayInterface,
): Promise<TeleportGUID> {
  const teleportInitializedEventHash = teleportOutboundGatewayInterface.getEventTopic('TeleportInitialized')
  const receipt = await waitForTxReceipt(srcDomainProvider, txHash)
  const teleportInitializedEvent = receipt.logs.find((e) => e.topics[0] === teleportInitializedEventHash)
  if (!teleportInitializedEvent) {
    throw new Error(`getTeleportGuid: no TeleportInitialized event found for txHash=${txHash}`)
  }
  return decodeTeleportData(teleportInitializedEvent.data)
}
