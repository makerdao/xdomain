import { Provider } from '@ethersproject/abstract-provider';
import { BigNumber, BigNumberish, Signer } from 'ethers';
import { DomainId, Relay, TeleportGUID } from '.';
export declare function getFeesAndMintableAmounts(srcDomain: DomainId, dstDomain: DomainId, dstDomainProvider: Provider, teleportGUID: TeleportGUID, relay?: Relay, isHighPriority?: boolean, relayParams?: {
    receiver: Signer;
    teleportGUID: TeleportGUID;
    signatures: string;
    maxFeePercentage?: BigNumberish;
    expiry?: BigNumberish;
    to?: string;
    data?: string;
}): Promise<{
    pending: BigNumber;
    mintable: BigNumber;
    bridgeFee: BigNumber;
    relayFee: BigNumber;
}>;
