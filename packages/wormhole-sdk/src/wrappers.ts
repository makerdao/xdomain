import { DomainId, WormholeBridge } from '.'
import { Provider } from '@ethersproject/abstract-provider'
import { Signer, BigNumberish, Overrides } from 'ethers'
import { WormholeGUID } from './guid'

export type DomainDescription = DomainId | 'arbitrum-testnet' | 'optimism-testnet' //| 'arbitrum' | 'optimism'

export interface DomainContext {
  srcDomain: DomainDescription
  destDomain?: DomainId
  srcDomainProvider?: Provider
  destDomainProvider?: Provider
}

function getLikelyDomainId(description: DomainDescription): DomainId {
  switch (description) {
    case 'RINKEBY-SLAVE-ARBITRUM-1':
    case 'arbitrum-testnet':
      return 'RINKEBY-SLAVE-ARBITRUM-1'
    case 'KOVAN-SLAVE-OPTIMISM-1':
    case 'optimism-testnet':
      return 'KOVAN-SLAVE-OPTIMISM-1'
    // case 'ETHEREUM-SLAVE-OPTIMISM-1':
    // case 'optimism':
    //   return 'ETHEREUM-SLAVE-OPTIMISM-1'
    // case 'ETHEREUM-SLAVE-ARBITRUM-1':
    // case 'arbitrum':
    //   return 'ETHEREUM-SLAVE-ARBITRUM-1'
    default:
      throw new Error(`Invalid domain description "${description}"`)
  }
}

export function getWormholeBridge(opts: DomainContext): WormholeBridge {
  return new WormholeBridge({ ...opts, srcDomain: getLikelyDomainId(opts.srcDomain) })
}

export interface InitWormholeOpts {
  sender: Signer
  receiverAddress: string
  amount: BigNumberish
  operatorAddress?: string
  overrides?: Overrides
}

export function initWormhole(opts: InitWormholeOpts & DomainContext): ReturnType<WormholeBridge['initWormhole']> {
  return getWormholeBridge(opts).initWormhole(
    opts.sender,
    opts.receiverAddress,
    opts.amount,
    opts.operatorAddress,
    opts.overrides,
  )
}

export function getAttestations(
  opts: { txHash: string } & DomainContext,
): ReturnType<WormholeBridge['getAttestations']> {
  return getWormholeBridge(opts).getAttestations(opts.txHash)
}

export function getAmountMintable(
  opts: { wormholeGUID: WormholeGUID } & DomainContext,
): ReturnType<WormholeBridge['getAmountMintable']> {
  return getWormholeBridge(opts).getAmountMintable(opts.wormholeGUID)
}

export interface MintWithOracleOpts {
  sender: Signer
  wormholeGUID: WormholeGUID
  signatures: string
  maxFeePercentage?: BigNumberish
  operatorFee?: BigNumberish
  overrides?: Overrides
}

export function mintWithOracles(
  opts: MintWithOracleOpts & DomainContext,
): ReturnType<WormholeBridge['mintWithOracles']> {
  return getWormholeBridge(opts).mintWithOracles(
    opts.sender,
    opts.wormholeGUID,
    opts.signatures,
    opts.maxFeePercentage,
    opts.operatorFee,
    opts.overrides,
  )
}
