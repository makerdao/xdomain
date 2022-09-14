import { BigNumberish, Signature, Signer } from 'ethers';
import { TeleportGUID } from '.';
import { BasicRelay } from './sdk/esm/types/BasicRelay';
import { TrustedRelay } from './sdk/esm/types/TrustedRelay';
export declare type Relay = BasicRelay | TrustedRelay;
export interface RelayParams {
    teleportGUID: TeleportGUID;
    signatures: string;
    r: string;
    s: string;
    v: number;
    maxFeePercentage?: BigNumberish;
    expiry?: BigNumberish;
    to?: string;
    data?: string;
}
export declare function signRelayPayload(receiver: Signer, teleportGUID: TeleportGUID, gasFee: BigNumberish, maxFeePercentage?: BigNumberish, expiry?: BigNumberish): Promise<Signature & {
    payload: string;
}>;
export declare function waitForRelayTaskConfirmation(taskId: string, pollingIntervalMs?: number, timeoutMs?: number): Promise<string>;
export declare function getRelayGasFee(relay: Relay, isHighPriority?: boolean, relayParams?: RelayParams): Promise<string>;
export declare function signAndCreateRelayTask(relay: Relay, receiver: Signer, teleportGUID: TeleportGUID, signatures: string, relayFee: BigNumberish, maxFeePercentage?: BigNumberish, expiry?: BigNumberish, to?: string, data?: string, onPayloadSigned?: (payload: string, r: string, s: string, v: number) => void): Promise<string>;
export declare function requestAndWaitForRelay(relay: Relay, receiver: Signer, teleportGUID: TeleportGUID, signatures: string, relayFee: BigNumberish, maxFeePercentage?: BigNumberish, expiry?: BigNumberish, to?: string, data?: string, pollingIntervalMs?: number, timeoutMs?: number, onPayloadSigned?: (payload: string, r: string, s: string, v: number) => void, onRelayTaskCreated?: (taskId: string) => void): Promise<string>;
