import { Provider } from '@ethersproject/abstract-provider';
import { BigNumber, BigNumberish, ContractTransaction, Overrides, Signer } from 'ethers';
import { DomainDescription, DomainId, TeleportGUID } from '.';
interface AllBridgeSettings {
    useFakeArbitrumOutbox: boolean;
}
export declare type BridgeSettings = Partial<AllBridgeSettings>;
export interface Call {
    tx?: ContractTransaction;
    to: string;
    data: string;
}
export interface TeleportBridgeOpts {
    srcDomain: DomainDescription;
    dstDomain?: DomainId;
    srcDomainProvider?: Provider;
    dstDomainProvider?: Provider;
    settings?: BridgeSettings;
}
export declare class TeleportBridge {
    srcDomain: DomainId;
    dstDomain: DomainId;
    srcDomainProvider: Provider;
    dstDomainProvider: Provider;
    settings: AllBridgeSettings;
    constructor({ srcDomain, dstDomain, srcDomainProvider, dstDomainProvider, settings }: TeleportBridgeOpts);
    initTeleport(receiverAddress: string, amount: BigNumberish, operatorAddress?: string, sender?: Signer, overrides?: Overrides): Promise<Call>;
    initRelayedTeleport(receiverAddress: string, amount: BigNumberish, sender?: Signer, relayAddress?: string, overrides?: Overrides): Promise<Call>;
    getAttestations(txHash: string, onNewSignatureReceived?: (numSignatures: number, threshold: number) => void, timeoutMs?: number, pollingIntervalMs?: number, teleportGUID?: TeleportGUID): Promise<{
        signatures: string;
        teleportGUID: TeleportGUID;
    }>;
    getSrcBalance(userAddress: string): Promise<BigNumber>;
    getDstBalance(userAddress: string): Promise<BigNumber>;
    getAmounts(withdrawn: BigNumberish, isHighPriority?: boolean, relayAddress?: string): Promise<{
        mintable: BigNumber;
        bridgeFee: BigNumber;
        relayFee?: BigNumber;
    }>;
    getAmountsForTeleportGUID(teleportGUID: TeleportGUID, isHighPriority?: boolean, relayParams?: {
        receiver: Signer;
        teleportGUID: TeleportGUID;
        signatures: string;
        maxFeePercentage?: BigNumberish;
        expiry?: BigNumberish;
        to?: string;
        data?: string;
    }, relayAddress?: string): Promise<{
        pending: BigNumber;
        mintable: BigNumber;
        bridgeFee: BigNumber;
        relayFee?: BigNumber;
    }>;
    requestFaucetDai(sender: Signer, overrides?: Overrides): Promise<ContractTransaction>;
    mintWithOracles(teleportGUID: TeleportGUID, signatures: string, maxFeePercentage?: BigNumberish, operatorFee?: BigNumberish, sender?: Signer, overrides?: Overrides): Promise<Call>;
    getRelayFee(isHighPriority?: boolean, relayParams?: {
        receiver: Signer;
        teleportGUID: TeleportGUID;
        signatures: string;
        maxFeePercentage?: BigNumberish;
        expiry?: BigNumberish;
        to?: string;
        data?: string;
    }, relayAddress?: string): Promise<string>;
    relayMintWithOracles(receiver: Signer, teleportGUID: TeleportGUID, signatures: string, relayFee: BigNumberish, maxFeePercentage?: BigNumberish, expiry?: BigNumberish, to?: string, data?: string, relayAddress?: string, pollingIntervalMs?: number, timeoutMs?: number, onPayloadSigned?: (payload: string, r: string, s: string, v: number) => void): Promise<string>;
    canMintWithoutOracle(txHash: string): Promise<boolean>;
    mintWithoutOracles(sender: Signer, txHash: string, overrides?: Overrides): Promise<ContractTransaction>;
}
export {};
