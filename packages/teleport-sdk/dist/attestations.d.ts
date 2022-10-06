import { DomainId, TeleportGUID } from '.';
import { TeleportOracleAuth } from './sdk/esm/types';
export declare const ORACLE_API_URLS: {
    [domain in DomainId]: string;
};
export declare function waitForAttestations(dstDomain: DomainId, txHash: string, threshold: number, isValidAttestation: TeleportOracleAuth['isValid'], pollingIntervalMs: number, teleportGUID?: TeleportGUID, timeoutMs?: number, onNewSignatureReceived?: (numSignatures: number, threshold: number, guid?: TeleportGUID) => void): Promise<{
    signatures: string;
    teleportGUID: TeleportGUID;
}>;
