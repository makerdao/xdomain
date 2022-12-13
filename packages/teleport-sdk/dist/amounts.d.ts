import { Provider } from '@ethersproject/abstract-provider';
import { BigNumber } from 'ethers';
import { DomainId, Relay, RelayParams, TeleportGUID } from '.';
/**
 * Check the Teleport system for fees and amounts mintable for a certain TeleportGUID
 * @internal
 * @see {@link TeleportGUID}
 * @see {@link Relay}
 *
 * @param srcDomain - domain identifier for the source domain
 * @param dstDomain - domain identifier for the destination domain
 * @param dstDomainProvider - ethers rpc provider for destination domain
 * @param teleportGUID - teleport action identifier
 * @param relay - relay to use when transmitting transaction to the destination domain
 * @param isHighPriority - whether this teleport action is to be expedited
 * @param relayParams - parameters passed onto the relayer
 * @returns promise to resolve with amounts corresponding to mintable tokens, bridge and relayer fees to be paid
 */
export declare function getFeesAndMintableAmounts(srcDomain: DomainId, dstDomain: DomainId, dstDomainProvider: Provider, teleportGUID: TeleportGUID, relay?: Relay, isHighPriority?: boolean, relayParams?: RelayParams): Promise<{
    pending: BigNumber;
    mintable: BigNumber;
    bridgeFee: BigNumber;
    relayFee?: BigNumber;
}>;
//# sourceMappingURL=amounts.d.ts.map