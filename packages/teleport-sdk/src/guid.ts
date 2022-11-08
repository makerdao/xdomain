import { providers } from 'ethers'
import { keccak256 } from 'ethers/lib/utils'

import { TeleportOutboundGatewayInterface } from './sdk/esm/types/TeleportOutboundGateway.d'
import { waitForTxReceipt } from './utils'

/**
 * Represents a single Teleport Action
 * @public
 * @remarks 
 * This is used throughout the SDK, Oracle system and smart contracts to
 * both track and verify token transfers
 * 
 * @see {@link DomainId}
 * @param sourceDomain - identifier for the source domain
 * @param targetDomain - identifier for the target domain
 * @param receiver - receiver of the teleported funds (on `targetDomain`)
 * @param operator -
 * @param amount - token amount to teleport (in wei)
 * @param nonce - used to uniquely identify the teleport action
 * @param timestamp - see above
 */
export interface TeleportGUID {
  sourceDomain: string
  targetDomain: string
  receiver: string
  operator: string
  amount: string
  nonce: string
  timestamp: string
}

/**
 * Parse an abi-encoded hex string and return a TeleportGUID object
 * 
 * @internal
 * @see {@link TeleportGUID}
 * @param teleportData - hexlified abi-encoded TeleportGUID object
 * @returns a TeleportGUID object usable by the SDK
 */
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

/**
 * Calculate the keccak256 hash of a TeleportGUID object
 * 
 * @remarks
 * This abi-encodes the TeleportGUID before hashing it, doing the same process as the
 * smart contracts.
 * 
 * @internal
 * @param teleportGUID - {@link TeleportGUID}
 * @returns keccak256 hash of the TeleportGUID object
 */
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
