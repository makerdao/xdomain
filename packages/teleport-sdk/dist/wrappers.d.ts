import { Provider } from '@ethersproject/abstract-provider';
import { BigNumberish, Overrides, Signer } from 'ethers';
import { BridgeSettings, DomainDescription, DomainId, TeleportBridge, TeleportGUID } from '.';
export interface DomainContext {
    srcDomain: DomainDescription;
    destDomain?: DomainId;
    srcDomainProvider?: Provider;
    destDomainProvider?: Provider;
    settings?: BridgeSettings;
}
export declare function getTeleportBridge(opts: DomainContext): TeleportBridge;
export interface InitTeleportOpts {
    receiverAddress: string;
    amount: BigNumberish;
    operatorAddress?: string;
    sender?: Signer;
    overrides?: Overrides;
}
export declare function initTeleport(opts: InitTeleportOpts & DomainContext): ReturnType<TeleportBridge['initTeleport']>;
export declare function initRelayedTeleport(opts: Omit<InitTeleportOpts, 'operatorAddress'> & {
    relayAddress?: string;
} & DomainContext): ReturnType<TeleportBridge['initTeleport']>;
export interface GetAttestationsOpts {
    txHash: string;
    onNewSignatureReceived?: (numSignatures: number, threshold: number) => void;
    timeoutMs?: number;
    pollingIntervalMs?: number;
    teleportGUID?: TeleportGUID;
}
export declare function getAttestations(opts: GetAttestationsOpts & DomainContext): ReturnType<TeleportBridge['getAttestations']>;
export declare function getSrcBalance(opts: {
    userAddress: string;
} & DomainContext): ReturnType<TeleportBridge['getSrcBalance']>;
export declare function getDstBalance(opts: {
    userAddress: string;
} & DomainContext): ReturnType<TeleportBridge['getDstBalance']>;
export declare function getAmountsForTeleportGUID(opts: {
    teleportGUID: TeleportGUID;
    isHighPriority?: boolean;
    relayParams?: {
        receiver: Signer;
        teleportGUID: TeleportGUID;
        signatures: string;
        maxFeePercentage?: BigNumberish;
        expiry?: BigNumberish;
        to?: string;
        data?: string;
    };
    relayAddress?: string;
} & DomainContext): ReturnType<TeleportBridge['getAmountsForTeleportGUID']>;
export declare function getAmounts(opts: {
    withdrawn: BigNumberish;
    isHighPriority?: boolean;
    relayAddress?: string;
} & DomainContext): ReturnType<TeleportBridge['getAmounts']>;
export interface MintWithOraclesOpts {
    teleportGUID: TeleportGUID;
    signatures: string;
    maxFeePercentage?: BigNumberish;
    operatorFee?: BigNumberish;
    sender?: Signer;
    overrides?: Overrides;
}
export declare function requestFaucetDai(opts: {
    sender: Signer;
    overrides?: Overrides;
} & DomainContext): ReturnType<TeleportBridge['requestFaucetDai']>;
export declare function mintWithOracles(opts: MintWithOraclesOpts & DomainContext): ReturnType<TeleportBridge['mintWithOracles']>;
export interface RelayMintWithOraclesOpts {
    receiver: Signer;
    teleportGUID: TeleportGUID;
    signatures: string;
    relayFee: BigNumberish;
    maxFeePercentage?: BigNumberish;
    expiry?: BigNumberish;
    to?: string;
    data?: string;
    relayAddress?: string;
    pollingIntervalMs?: number;
    timeoutMs?: number;
    onPayloadSigned?: (payload: string, r: string, s: string, v: number) => void;
}
export declare function relayMintWithOracles(opts: RelayMintWithOraclesOpts & DomainContext): ReturnType<TeleportBridge['relayMintWithOracles']>;
export declare function canMintWithoutOracle(opts: {
    txHash: string;
} & DomainContext): ReturnType<TeleportBridge['canMintWithoutOracle']>;
export interface MintWithoutOracleOpts {
    sender: Signer;
    txHash: string;
    overrides?: Overrides;
}
export declare function mintWithoutOracles(opts: MintWithoutOracleOpts & DomainContext): ReturnType<TeleportBridge['mintWithoutOracles']>;
