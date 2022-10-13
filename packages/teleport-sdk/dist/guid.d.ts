import { providers } from 'ethers';
import { TeleportOutboundGatewayInterface } from './sdk/esm/types/TeleportOutboundGateway.d';
export interface TeleportGUID {
    sourceDomain: string;
    targetDomain: string;
    receiver: string;
    operator: string;
    amount: string;
    nonce: string;
    timestamp: string;
}
export declare function decodeTeleportData(teleportData: string): TeleportGUID;
export declare function getGuidHash(teleportGUID: TeleportGUID): string;
export declare function getTeleportGuid(txHash: string, srcDomainProvider: providers.Provider, teleportOutboundGatewayInterface: TeleportOutboundGatewayInterface): Promise<TeleportGUID>;
