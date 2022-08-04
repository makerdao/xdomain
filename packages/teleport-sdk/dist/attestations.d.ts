import { TeleportGUID } from '.';
import { TeleportOracleAuth } from './sdk/esm/types';
export declare function waitForAttestations(txHash: string, threshold: number, isValidAttestation: TeleportOracleAuth['isValid'], pollingIntervalMs: number, teleportGUID?: TeleportGUID, timeoutMs?: number, onNewSignatureReceived?: (numSignatures: number, threshold: number) => void): Promise<{
    signatures: string;
    teleportGUID: TeleportGUID;
}>;
