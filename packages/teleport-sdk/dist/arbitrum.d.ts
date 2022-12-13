import { Provider } from '@ethersproject/abstract-provider';
import { ContractTransaction, Overrides, Signer } from 'ethers';
export declare function isArbitrumMessageInOutbox(txHash: string, srcDomainProvider: Provider, dstDomainProvider: Provider): Promise<boolean>;
export declare function relayArbitrumMessage(txHash: string, sender: Signer, srcDomainProvider: Provider, useFakeOutbox: boolean, overrides?: Overrides): Promise<ContractTransaction>;
//# sourceMappingURL=arbitrum.d.ts.map