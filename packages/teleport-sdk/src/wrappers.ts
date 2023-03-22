import { Provider } from '@ethersproject/abstract-provider'
import { BigNumberish, Overrides, Signer } from 'ethers'

import {
  BridgeSettings,
  DomainDescription,
  DomainId,
  getLikelyDomainId,
  RelayParams,
  TeleportBridge,
  TeleportGUID,
} from '.'

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
  onNewSignatureReceived?: (numSignatures: number, threshold: number, guid?: TeleportGUID) => void
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
    relayParams?: RelayParams
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

export function getTeleportGuidFromTxHash(
  opts: { txHash: string } & DomainContext,
): ReturnType<TeleportBridge['getTeleportGuidFromTxHash']> {
  return getTeleportBridge(opts).getTeleportGuidFromTxHash(opts.txHash)
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

export interface WaitForMintOpts {
  teleportGUIDorGUIDHash: TeleportGUID | string
  pollingIntervalMs?: number
  timeoutMs?: number
}

export function waitForMint(opts: WaitForMintOpts & DomainContext): ReturnType<TeleportBridge['waitForMint']> {
  return getTeleportBridge(opts).waitForMint(opts.teleportGUIDorGUIDHash, opts.pollingIntervalMs, opts.timeoutMs)
}

export interface GetRelayFeeOpts {
  isHighPriority?: boolean
  relayParams?: RelayParams
  relayAddress?: string
}

export function getRelayFee(opts: GetRelayFeeOpts & DomainContext): ReturnType<TeleportBridge['getRelayFee']> {
  return getTeleportBridge(opts).getRelayFee(opts.isHighPriority, opts.relayParams, opts.relayAddress)
}

export interface SignRelayOpts {
  receiver: Signer
  teleportGUID: TeleportGUID
  relayFee: BigNumberish
  maxFeePercentage?: BigNumberish
  expiry?: BigNumberish
}

export function signRelay(opts: SignRelayOpts & DomainContext): ReturnType<TeleportBridge['signRelay']> {
  return getTeleportBridge(opts).signRelay(
    opts.receiver,
    opts.teleportGUID,
    opts.relayFee,
    opts.maxFeePercentage,
    opts.expiry,
  )
}

export type RequestRelayOpts = SignRelayOpts & {
  signatures: string
  relayAddress?: string
  onPayloadSigned?: (payload: string, r: string, s: string, v: number) => void
}

export function requestRelay(opts: RequestRelayOpts & DomainContext): ReturnType<TeleportBridge['requestRelay']> {
  return getTeleportBridge(opts).requestRelay(
    opts.receiver,
    opts.teleportGUID,
    opts.signatures,
    opts.relayFee,
    opts.maxFeePercentage,
    opts.expiry,
    opts.relayAddress,
    opts.onPayloadSigned,
  )
}

export type RelayMintWithOraclesOpts = RequestRelayOpts & {
  pollingIntervalMs?: number
  timeoutMs?: number
  onRelayTaskCreated?: (taskId: string) => void
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
    opts.relayAddress,
    opts.pollingIntervalMs,
    opts.timeoutMs,
    opts.onPayloadSigned,
    opts.onRelayTaskCreated,
  )
}

export function waitForRelayTask(
  opts: { taskId: string; pollingIntervalMs?: number; timeoutMs?: number } & DomainContext,
): ReturnType<TeleportBridge['waitForRelayTask']> {
  return getTeleportBridge(opts).waitForRelayTask(opts.taskId, opts.pollingIntervalMs, opts.timeoutMs)
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
