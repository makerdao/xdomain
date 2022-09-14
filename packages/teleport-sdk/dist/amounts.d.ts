import { Provider } from '@ethersproject/abstract-provider';
import { BigNumber } from 'ethers';
import { DomainId, Relay, RelayParams, TeleportGUID } from '.';
export declare function getFeesAndMintableAmounts(srcDomain: DomainId, dstDomain: DomainId, dstDomainProvider: Provider, teleportGUID: TeleportGUID, relay?: Relay, isHighPriority?: boolean, relayParams?: RelayParams): Promise<{
    pending: BigNumber;
    mintable: BigNumber;
    bridgeFee: BigNumber;
    relayFee?: BigNumber;
}>;
