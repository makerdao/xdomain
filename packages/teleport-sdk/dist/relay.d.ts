import { BigNumberish, Signer } from 'ethers';
import { TeleportGUID } from '.';
import { BasicRelay } from './sdk/esm/types/BasicRelay';
import { TrustedRelay } from './sdk/esm/types/TrustedRelay';
export declare type Relay = BasicRelay | TrustedRelay;
export declare function getRelayGasFee(relay: Relay, isHighPriority?: boolean, relayParams?: {
    receiver: Signer;
    teleportGUID: TeleportGUID;
    signatures: string;
    maxFeePercentage?: BigNumberish;
    expiry?: BigNumberish;
    to?: string;
    data?: string;
}): Promise<string>;
export declare function waitForRelay(relay: Relay, receiver: Signer, teleportGUID: TeleportGUID, signatures: string, relayFee: BigNumberish, maxFeePercentage?: BigNumberish, expiry?: BigNumberish, to?: string, data?: string, pollingIntervalMs?: number, timeoutMs?: number, onPayloadSigned?: (payload: string, r: string, s: string, v: number) => void): Promise<string>;
