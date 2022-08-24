import { Provider } from '@ethersproject/providers';
import { ContractTransaction, Overrides, Signer } from 'ethers';
export declare type ArbitrumDstDomainId = 'ETH-GOER-A';
export declare function isArbitrumMessageInOutbox(txHash: string, srcDomainProvider: Provider, dstDomainProvider: Provider): Promise<boolean>;
export declare function relayArbitrumMessage(txHash: string, sender: Signer, dstDomain: ArbitrumDstDomainId, srcDomainProvider: Provider, useFakeOutbox: boolean, overrides?: Overrides): Promise<ContractTransaction>;
