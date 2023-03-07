import { Provider } from '@ethersproject/abstract-provider'
import { BigNumberish, Overrides, Signer } from 'ethers'

import { BridgeSettings, DomainDescription, DomainId, getLikelyDomainId, TeleportBridge, TeleportGUID } from '.'

export interface DomainContext {
  srcDomain: DomainDescription
  destDomain?: DomainId
  srcDomainProvider?: Provider
  destDomainProvider?: Provider
  settings?: BridgeSettings
}

export function getTeleportBridge(opts: DomainContext): TeleportBridge {
  return new TeleportBridge({ ...opts, srcDomain: getLikelyDomainId(opts.srcDomain) })
}

export function approveSrcGateway(
  opts: { sender?: Signer; amount?: BigNumberish; overrides?: Overrides } & DomainContext,
): ReturnType<TeleportBridge['approveSrcGateway']> {
  return getTeleportBridge(opts).approveSrcGateway(opts.sender, opts.amount, opts.overrides)
}

export interface InitTeleportOpts {
  receiverAddress: string
  amount: BigNumberish
  operatorAddress?: string
  sender?: Signer
  overrides?: Overrides
}

export function initTeleport(opts: InitTeleportOpts & DomainContext): ReturnType<TeleportBridge['initTeleport']> {
  return getTeleportBridge(opts).initTeleport(
    opts.receiverAddress,
    opts.amount,
    opts.operatorAddress,
    opts.sender,
    opts.overrides,
  )
}

export function initRelayedTeleport(
  opts: Omit<InitTeleportOpts, 'operatorAddress'> & { relayAddress?: string } & DomainContext,
): ReturnType<TeleportBridge['initTeleport']> {
  return getTeleportBridge(opts).initRelayedTeleport(
    opts.receiverAddress,
    opts.amount,
    opts.sender,
    opts.relayAddress,
    opts.overrides,
  )
}

export interface GetAttestationsOpts {
  txHash: string
  onNewSignatureReceived?: (numSignatures: number, threshold: number) => void
  timeoutMs?: number
  pollingIntervalMs?: number
  teleportGUID?: TeleportGUID
}

export function getAttestations(
  opts: GetAttestationsOpts & DomainContext,
): ReturnType<TeleportBridge['getAttestations']> {
  return getTeleportBridge(opts).getAttestations(
    opts.txHash,
    opts.onNewSignatureReceived,
    opts.timeoutMs,
    opts.pollingIntervalMs,
    opts.teleportGUID,
  )
}

export function getSrcBalance(
  opts: { userAddress: string } & DomainContext,
): ReturnType<TeleportBridge['getSrcBalance']> {
  return getTeleportBridge(opts).getSrcBalance(opts.userAddress)
}

export function getDstBalance(
  opts: { userAddress: string } & DomainContext,
): ReturnType<TeleportBridge['getDstBalance']> {
  return getTeleportBridge(opts).getDstBalance(opts.userAddress)
}

export function getSrcGatewayAllowance(
  opts: { userAddress: string } & DomainContext,
): ReturnType<TeleportBridge['getSrcGatewayAllowance']> {
  return getTeleportBridge(opts).getSrcGatewayAllowance(opts.userAddress)
}

export function getAmountsForTeleportGUID(
  opts: {
    teleportGUID: TeleportGUID
    isHighPriority?: boolean
    relayParams?: {
      receiver: Signer
      teleportGUID: TeleportGUID
      signatures: string
      maxFeePercentage?: BigNumberish
      expiry?: BigNumberish
      to?: string
      data?: string
    }
    relayAddress?: string
  } & DomainContext,
): ReturnType<TeleportBridge['getAmountsForTeleportGUID']> {
  return getTeleportBridge(opts).getAmountsForTeleportGUID(
    opts.teleportGUID,
    opts.isHighPriority,
    opts.relayParams,
    opts.relayAddress,
  )
}

export function getAmounts(
  opts: { withdrawn: BigNumberish; isHighPriority?: boolean; relayAddress?: string } & DomainContext,
): ReturnType<TeleportBridge['getAmounts']> {
  return getTeleportBridge(opts).getAmounts(opts.withdrawn, opts.isHighPriority, opts.relayAddress)
}

export interface MintWithOraclesOpts {
  teleportGUID: TeleportGUID
  signatures: string
  maxFeePercentage?: BigNumberish
  operatorFee?: BigNumberish
  sender?: Signer
  overrides?: Overrides
}

export function requestFaucetDai(
  opts: { sender: Signer; overrides?: Overrides } & DomainContext,
): ReturnType<TeleportBridge['requestFaucetDai']> {
  return getTeleportBridge(opts).requestFaucetDai(opts.sender, opts.overrides)
}

export function mintWithOracles(
  opts: MintWithOraclesOpts & DomainContext,
): ReturnType<TeleportBridge['mintWithOracles']> {
  return getTeleportBridge(opts).mintWithOracles(
    opts.teleportGUID,
    opts.signatures,
    opts.maxFeePercentage,
    opts.operatorFee,
    opts.sender,
    opts.overrides,
  )
}

export interface RelayMintWithOraclesOpts {
  receiver: Signer
  teleportGUID: TeleportGUID
  signatures: string
  relayFee: BigNumberish
  maxFeePercentage?: BigNumberish
  expiry?: BigNumberish
  to?: string
  data?: string
  relayAddress?: string
  pollingIntervalMs?: number
  timeoutMs?: number
  onPayloadSigned?: (payload: string, r: string, s: string, v: number) => void
}

export function relayMintWithOracles(
  opts: RelayMintWithOraclesOpts & DomainContext,
): ReturnType<TeleportBridge['relayMintWithOracles']> {
  return getTeleportBridge(opts).relayMintWithOracles(
    opts.receiver,
    opts.teleportGUID,
    opts.signatures,
    opts.relayFee,
    opts.maxFeePercentage,
    opts.expiry,
    opts.to,
    opts.data,
    opts.relayAddress,
    opts.pollingIntervalMs,
    opts.timeoutMs,
    opts.onPayloadSigned,
  )
}

export function canMintWithoutOracle(
  opts: { txHash: string } & DomainContext,
): ReturnType<TeleportBridge['canMintWithoutOracle']> {
  return getTeleportBridge(opts).canMintWithoutOracle(opts.txHash)
}

export interface MintWithoutOracleOpts {
  sender: Signer
  txHash: string
  overrides?: Overrides
}

export function mintWithoutOracles(
  opts: MintWithoutOracleOpts & DomainContext,
): ReturnType<TeleportBridge['mintWithoutOracles']> {
  return getTeleportBridge(opts).mintWithoutOracles(opts.sender, opts.txHash, opts.overrides)
}
