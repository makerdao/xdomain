import { Provider } from '@ethersproject/abstract-provider'
import { BigNumberish, Overrides, Signer } from 'ethers'

import { BridgeSettings, DomainDescription, DomainId, getLikelyDomainId, WormholeBridge, WormholeGUID } from '.'

export interface DomainContext {
  srcDomain: DomainDescription
  destDomain?: DomainId
  srcDomainProvider?: Provider
  destDomainProvider?: Provider
  settings?: BridgeSettings
}

export function getWormholeBridge(opts: DomainContext): WormholeBridge {
  return new WormholeBridge({ ...opts, srcDomain: getLikelyDomainId(opts.srcDomain) })
}

export interface InitWormholeOpts {
  receiverAddress: string
  amount: BigNumberish
  operatorAddress?: string
  sender?: Signer
  overrides?: Overrides
}

export function initWormhole(opts: InitWormholeOpts & DomainContext): ReturnType<WormholeBridge['initWormhole']> {
  return getWormholeBridge(opts).initWormhole(
    opts.receiverAddress,
    opts.amount,
    opts.operatorAddress,
    opts.sender,
    opts.overrides,
  )
}

export function initRelayedWormhole(
  opts: Omit<InitWormholeOpts, 'operatorAddress'> & { relayAddress?: string } & DomainContext,
): ReturnType<WormholeBridge['initWormhole']> {
  return getWormholeBridge(opts).initRelayedWormhole(
    opts.receiverAddress,
    opts.amount,
    opts.sender,
    opts.relayAddress,
    opts.overrides,
  )
}

export interface GetAttestationsOpts {
  txHash: string
  newSignatureReceivedCallback?: (numSignatures: number, threshold: number) => void
  timeoutMs?: number
  pollingIntervalMs?: number
  wormholeGUID?: WormholeGUID
}

export function getAttestations(
  opts: GetAttestationsOpts & DomainContext,
): ReturnType<WormholeBridge['getAttestations']> {
  return getWormholeBridge(opts).getAttestations(
    opts.txHash,
    opts.newSignatureReceivedCallback,
    opts.timeoutMs,
    opts.pollingIntervalMs,
    opts.wormholeGUID,
  )
}

export function getAmountsForWormholeGUID(
  opts: {
    wormholeGUID: WormholeGUID
    isHighPriority?: boolean
    relayParams?: {
      receiver: Signer
      wormholeGUID: WormholeGUID
      signatures: string
      maxFeePercentage?: BigNumberish
      expiry?: BigNumberish
      to?: string
      data?: string
    }
    relayAddress?: string
  } & DomainContext,
): ReturnType<WormholeBridge['getAmountsForWormholeGUID']> {
  return getWormholeBridge(opts).getAmountsForWormholeGUID(opts.wormholeGUID, opts.isHighPriority, opts.relayParams)
}

export function getAmounts(
  opts: { withdrawn: BigNumberish; isHighPriority?: boolean; relayAddress?: string } & DomainContext,
): ReturnType<WormholeBridge['getAmounts']> {
  return getWormholeBridge(opts).getAmounts(opts.withdrawn, opts.isHighPriority)
}

export interface MintWithOraclesOpts {
  wormholeGUID: WormholeGUID
  signatures: string
  maxFeePercentage?: BigNumberish
  operatorFee?: BigNumberish
  sender?: Signer
  overrides?: Overrides
}

export function mintWithOracles(
  opts: MintWithOraclesOpts & DomainContext,
): ReturnType<WormholeBridge['mintWithOracles']> {
  return getWormholeBridge(opts).mintWithOracles(
    opts.wormholeGUID,
    opts.signatures,
    opts.maxFeePercentage,
    opts.operatorFee,
    opts.sender,
    opts.overrides,
  )
}

export interface RelayMintWithOraclesOpts {
  receiver: Signer
  wormholeGUID: WormholeGUID
  signatures: string
  relayFee: BigNumberish
  maxFeePercentage?: BigNumberish
  expiry?: BigNumberish
  to?: string
  data?: string
  relayAddress?: string
}

export function relayMintWithOracles(
  opts: RelayMintWithOraclesOpts & DomainContext,
): ReturnType<WormholeBridge['relayMintWithOracles']> {
  return getWormholeBridge(opts).relayMintWithOracles(
    opts.receiver,
    opts.wormholeGUID,
    opts.signatures,
    opts.relayFee,
    opts.maxFeePercentage,
    opts.expiry,
    opts.to,
    opts.data,
    opts.relayAddress,
  )
}

export function canMintWithoutOracle(
  opts: { txHash: string } & DomainContext,
): ReturnType<WormholeBridge['canMintWithoutOracle']> {
  return getWormholeBridge(opts).canMintWithoutOracle(opts.txHash)
}

export interface MintWithoutOracleOpts {
  sender: Signer
  txHash: string
  overrides?: Overrides
}

export function mintWithoutOracles(
  opts: MintWithoutOracleOpts & DomainContext,
): ReturnType<WormholeBridge['mintWithoutOracles']> {
  return getWormholeBridge(opts).mintWithoutOracles(opts.sender, opts.txHash, opts.overrides)
}
