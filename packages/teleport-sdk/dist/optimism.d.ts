import { Provider } from '@ethersproject/abstract-provider';
import { ContractTransaction, Overrides, Signer } from 'ethers';
export declare function isOptimismMessageReadyToBeRelayed(txHash: string, srcChainId: number, dstChainId: number, srcDomainProvider: Provider, dstDomainProvider: Provider): Promise<boolean>;
export declare function relayOptimismMessage(txHash: string, sender: Signer, srcChainId: number, dstChainId: number, srcDomainProvider: Provider, dstDomainProvider: Provider, overrides?: Overrides): Promise<ContractTransaction>;
//# sourceMappingURL=optimism.d.ts.map