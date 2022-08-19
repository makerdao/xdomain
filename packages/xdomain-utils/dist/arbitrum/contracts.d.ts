import { BigNumberish, BytesLike, CallOverrides, Contract, ContractTransaction, PayableOverrides, providers, Signer } from "ethers";
export interface L1ArbitrumRouterLike {
    outboundTransfer(l1Token: string, to: string, amount: BigNumberish, maxGas: BigNumberish, gasPriceBid: BigNumberish, data: BytesLike, overrides?: PayableOverrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    setGateways(token: string[], gateway: string[], maxGas: BigNumberish, gasPriceBid: BigNumberish, maxSubmissionCost: BigNumberish, overrides?: PayableOverrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    connect(signerOrProvider: Signer | providers.Provider | string): L1ArbitrumRouterLike;
}
export interface L1ArbitrumGatewayLike {
    address: string;
    l1Dai(overrides?: CallOverrides): Promise<string>;
    getOutboundCalldata(l1Token: string, from: string, to: string, amount: BigNumberish, data: BytesLike, overrides?: CallOverrides): Promise<string>;
    outboundTransfer(l1Token: string, to: string, amount: BigNumberish, maxGas: BigNumberish, gasPriceBid: BigNumberish, data: BytesLike, overrides?: PayableOverrides & {
        from?: string;
    }): Promise<ContractTransaction>;
    connect(signerOrProvider: Signer | providers.Provider | string): L1ArbitrumGatewayLike;
}
export declare const arbitrumL2CoreContracts: {
    nodeInterface: string;
};
export declare function getArbitrumNodeInterface(l2: providers.Provider): Contract;
export declare function getArbitrumInbox(inboxAddress: string, l1: providers.Provider): Contract;
