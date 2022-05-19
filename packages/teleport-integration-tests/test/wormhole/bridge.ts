import { BigNumber, BytesLike, CallOverrides, Contract } from 'ethers'

import {
  OptimismIL1WormholeGateway as IL1WormholeGateway,
  OptimismIL2WormholeGateway as IL2WormholeGateway,
} from '../../typechain'
import { AuthableLike } from '../pe-utils/auth'

export type L1WormholeBridgeLike = IL1WormholeGateway
export type L2WormholeBridgeLike = IL2WormholeGateway & {
  batchedDaiToFlush(arg0: BytesLike, overrides?: CallOverrides): Promise<BigNumber>
} & AuthableLike

export type DaiLike = Contract
export type L1EscrowLike = Contract

export type WormholeBridgeSdk = { l1WormholeBridge: L1WormholeBridgeLike; l2WormholeBridge: L2WormholeBridgeLike }
export type BaseBridgeSdk = {
  l2Dai: DaiLike
  l1Escrow: L1EscrowLike
  l1GovRelay: Contract
  l2GovRelay: Contract
}
