import { DomainId, TeleportGUID } from '.';
import { TeleportOracleAuth } from './sdk/esm/types';
export declare const ORACLE_API_URLS: {
    [domain in DomainId]: string;
};
/**
 * Collect attestations for a transaction from the Oracle network
 * @public
 * @param txHash - hash of the transaction to attest
 * @param threshold - number of signatures to collect
 * @param isValidAttestation - callback to check if an oracle signature is valid
 * @param pollingIntervalMs
 * @param teleportGUID - {@link TeleportGUID} created by the `txHash` transaction
 * @param timeoutMs
 * @param onNewSignatureReceived - callback
 * @returns Promise containing oracle attestations, and the attested {@link TeleportGUID}
 */
export declare function waitForAttestations(dstDomain: DomainId, txHash: string, threshold: number, isValidAttestation: TeleportOracleAuth['isValid'], pollingIntervalMs: number, teleportGUID?: TeleportGUID, timeoutMs?: number, onNewSignatureReceived?: (numSignatures: number, threshold: number, guid?: TeleportGUID) => void): Promise<{
    signatures: string;
    teleportGUID: TeleportGUID;
}>;
//# sourceMappingURL=attestations.d.ts.map