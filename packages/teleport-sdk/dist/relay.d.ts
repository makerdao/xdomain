import { BigNumberish, Signature, Signer } from 'ethers';
import { TeleportGUID } from '.';
import { BasicRelay } from './sdk/esm/types/BasicRelay';
import { TrustedRelay } from './sdk/esm/types/TrustedRelay';
/**
 * Represents a transaction relay service.
 */
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
/**
 * Spins while waiting for the relayer to confirm its transaction
 * @internal
 * @param taskId - task identifier from {@link createRelayTask}
 * @param pollingIntervalMs
 * @param timeoutMs
 * @throws {@link Error}
 * On error, throws an Error containing the failure reason
 * @returns Promise containing the relayed transaction's hash
 */
export declare function waitForRelayTaskConfirmation(taskId: string, pollingIntervalMs?: number, timeoutMs?: number): Promise<string>;
/**
 * Get the network gas fee to be paid for the transaction
 * @internal
 * @param relay - {@link Relay} to use
 * @param isHighPriority - whether this transaction is to be expedited
 * @param relayParams - parameters for the relayer's transaction
 * @returns Promise containing estimated gas fee to be paid
 */
export declare function getRelayGasFee(relay: Relay, isHighPriority?: boolean, relayParams?: RelayParams): Promise<string>;
/**
 * Relay a Teleport transaction and wait for the relayer to confirm its execution
 * @public
 * @param relay - {@link Relay} to use
 * @param receiver - address that will receive tokens on the target domain
 * @param teleportGUID - identifier for the teleport action. @see {@link TeleportGUID}
 * @param signatures - deposit attestations obtained from the oracle network
 * @param relayFee - fee to be paid to the relayer
 * @param maxFeePercentage - maximum fee approved by the user
 * @param expiry - expiration date of the operation
 * @param to - address to call after tokens are minted
 * @param data - data to call `to` with
 * @param pollingIntervalMs -
 * @param timeoutMs -
 * @param onPayloadSigned - callback
 * @returns Promise containing the relayed transaction's hash
 */
export declare function signAndCreateRelayTask(relay: Relay, receiver: Signer, teleportGUID: TeleportGUID, signatures: string, relayFee: BigNumberish, maxFeePercentage?: BigNumberish, expiry?: BigNumberish, to?: string, data?: string, onPayloadSigned?: (payload: string, r: string, s: string, v: number) => void): Promise<string>;
export declare function requestAndWaitForRelay(relay: Relay, receiver: Signer, teleportGUID: TeleportGUID, signatures: string, relayFee: BigNumberish, maxFeePercentage?: BigNumberish, expiry?: BigNumberish, to?: string, data?: string, pollingIntervalMs?: number, timeoutMs?: number, onPayloadSigned?: (payload: string, r: string, s: string, v: number) => void, onRelayTaskCreated?: (taskId: string) => void): Promise<string>;
//# sourceMappingURL=relay.d.ts.map