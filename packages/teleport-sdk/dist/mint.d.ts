import { Provider } from '@ethersproject/abstract-provider';
import { DomainId, TeleportGUID } from '.';
export declare function waitForMintConfirmation(srcDomain: DomainId, dstDomain: DomainId, dstDomainProvider: Provider, teleportGUIDorGUIDHash: TeleportGUID | string, pollingIntervalMs?: number, timeoutMs?: number): Promise<string>;
//# sourceMappingURL=mint.d.ts.map