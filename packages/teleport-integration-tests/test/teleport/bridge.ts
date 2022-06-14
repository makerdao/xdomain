import { BigNumber, BytesLike, CallOverrides, Contract } from 'ethers'

import {
  OptimismIL1TeleportGateway as IL1TeleportGateway,
  OptimismIL2TeleportGateway as IL2TeleportGateway,
} from '../../typechain'
import { AuthableLike } from '../pe-utils/auth'

export type L1TeleportBridgeLike = IL1TeleportGateway
export type L2TeleportBridgeLike = IL2TeleportGateway & {
  batchedDaiToFlush(arg0: BytesLike, overrides?: CallOverrides): Promise<BigNumber>
} & AuthableLike

export type DaiLike = Contract
export type L1EscrowLike = Contract

export type TeleportBridgeSdk = { l1TeleportBridge: L1TeleportBridgeLike; l2TeleportBridge: L2TeleportBridgeLike }
export type BaseBridgeSdk = {
  l2Dai: DaiLike
  l1Escrow: L1EscrowLike
  l1GovRelay: Contract
  l2GovRelay: Contract
}
