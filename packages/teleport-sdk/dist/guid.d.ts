import { providers } from 'ethers';
import { TeleportOutboundGatewayInterface } from './sdk/esm/types/TeleportOutboundGateway.d';
/**
 * Represents a single Teleport Action
 * @public
 * @remarks
 * This is used throughout the SDK, Oracle system and smart contracts to
 * both track and verify token transfers
 *
 * @see {@link DomainId}
 * @param sourceDomain - identifier for the source domain
 * @param targetDomain - identifier for the target domain
 * @param receiver - receiver of the teleported funds (on `targetDomain`)
 * @param operator -
 * @param amount - token amount to teleport (in wei)
 * @param nonce - used to uniquely identify the teleport action
 * @param timestamp - see above
 */
export interface TeleportGUID {
    sourceDomain: string;
    targetDomain: string;
    receiver: string;
    operator: string;
    amount: string;
    nonce: string;
    timestamp: string;
}
/**
 * Parse an abi-encoded hex string and return a TeleportGUID object
 *
 * @internal
 * @see {@link TeleportGUID}
 * @param teleportData - hexlified abi-encoded TeleportGUID object
 * @returns a TeleportGUID object usable by the SDK
 */
export declare function decodeTeleportData(teleportData: string): TeleportGUID;
/**
 * Calculate the keccak256 hash of a TeleportGUID object
 *
 * @remarks
 * This abi-encodes the TeleportGUID before hashing it, doing the same process as the
 * smart contracts.
 *
 * @internal
 * @param teleportGUID - {@link TeleportGUID}
 * @returns keccak256 hash of the TeleportGUID object
 */
export declare function getGuidHash(teleportGUID: TeleportGUID): string;
export declare function getTeleportGuid(txHash: string, srcDomainProvider: providers.Provider, teleportOutboundGatewayInterface: TeleportOutboundGatewayInterface): Promise<TeleportGUID>;
//# sourceMappingURL=guid.d.ts.map