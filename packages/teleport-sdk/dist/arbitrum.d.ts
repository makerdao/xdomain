import { Provider } from '@ethersproject/abstract-provider';
import { ContractTransaction, Overrides, Signer } from 'ethers';
export declare type ArbitrumDstDomainId = 'RINKEBY-MASTER-1';
export declare function isArbitrumMessageInOutbox(txHash: string, dstDomain: ArbitrumDstDomainId, srcDomainProvider: Provider, dstDomainProvider: Provider): Promise<boolean>;
export declare function relayArbitrumMessage(txHash: string, sender: Signer, dstDomain: ArbitrumDstDomainId, srcDomainProvider: Provider, useFakeOutbox: boolean, overrides?: Overrides): Promise<ContractTransaction>;
