import { Provider } from '@ethersproject/abstract-provider';
import { BigNumberish, Overrides, Signer } from 'ethers';
import { BridgeSettings, DomainDescription, DomainId, RelayParams, TeleportBridge, TeleportGUID } from '.';
export interface DomainContext {
    srcDomain: DomainDescription;
    destDomain?: DomainId;
    srcDomainProvider?: Provider;
    destDomainProvider?: Provider;
    settings?: BridgeSettings;
}
export declare function getTeleportBridge(opts: DomainContext): TeleportBridge;
export declare function approveSrcGateway(opts: {
    sender?: Signer;
    amount?: BigNumberish;
    overrides?: Overrides;
} & DomainContext): ReturnType<TeleportBridge['approveSrcGateway']>;
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
    onNewSignatureReceived?: (numSignatures: number, threshold: number, guid?: TeleportGUID) => void;
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
export declare function getSrcGatewayAllowance(opts: {
    userAddress: string;
} & DomainContext): ReturnType<TeleportBridge['getSrcGatewayAllowance']>;
export declare function getAmountsForTeleportGUID(opts: {
    teleportGUID: TeleportGUID;
    isHighPriority?: boolean;
    relayParams?: RelayParams;
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
export declare function getTeleportGuidFromTxHash(opts: {
    txHash: string;
} & DomainContext): ReturnType<TeleportBridge['getTeleportGuidFromTxHash']>;
export declare function requestFaucetDai(opts: {
    sender: Signer;
    overrides?: Overrides;
} & DomainContext): ReturnType<TeleportBridge['requestFaucetDai']>;
export declare function mintWithOracles(opts: MintWithOraclesOpts & DomainContext): ReturnType<TeleportBridge['mintWithOracles']>;
export interface WaitForMintOpts {
    teleportGUIDorGUIDHash: TeleportGUID | string;
    pollingIntervalMs?: number;
    timeoutMs?: number;
}
export declare function waitForMint(opts: WaitForMintOpts & DomainContext): ReturnType<TeleportBridge['waitForMint']>;
export interface GetRelayFeeOpts {
    isHighPriority?: boolean;
    relayParams?: RelayParams;
    relayAddress?: string;
}
export declare function getRelayFee(opts: GetRelayFeeOpts & DomainContext): ReturnType<TeleportBridge['getRelayFee']>;
export interface SignRelayOpts {
    receiver: Signer;
    teleportGUID: TeleportGUID;
    relayFee: BigNumberish;
    maxFeePercentage?: BigNumberish;
    expiry?: BigNumberish;
}
export declare function signRelay(opts: SignRelayOpts & DomainContext): ReturnType<TeleportBridge['signRelay']>;
export declare type RequestRelayOpts = SignRelayOpts & {
    signatures: string;
    relayAddress?: string;
    onPayloadSigned?: (payload: string, r: string, s: string, v: number) => void;
};
export declare function requestRelay(opts: RequestRelayOpts & DomainContext): ReturnType<TeleportBridge['requestRelay']>;
export declare type RelayMintWithOraclesOpts = RequestRelayOpts & {
    pollingIntervalMs?: number;
    timeoutMs?: number;
    onRelayTaskCreated?: (taskId: string) => void;
};
export declare function relayMintWithOracles(opts: RelayMintWithOraclesOpts & DomainContext): ReturnType<TeleportBridge['relayMintWithOracles']>;
export declare function waitForRelayTask(opts: {
    taskId: string;
    pollingIntervalMs?: number;
    timeoutMs?: number;
} & DomainContext): ReturnType<TeleportBridge['waitForRelayTask']>;
export declare function canMintWithoutOracle(opts: {
    txHash: string;
} & DomainContext): ReturnType<TeleportBridge['canMintWithoutOracle']>;
export interface MintWithoutOracleOpts {
    sender: Signer;
    txHash: string;
    overrides?: Overrides;
}
export declare function mintWithoutOracles(opts: MintWithoutOracleOpts & DomainContext): ReturnType<TeleportBridge['mintWithoutOracles']>;
//# sourceMappingURL=wrappers.d.ts.map