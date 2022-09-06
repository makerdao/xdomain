import { BigNumber, ethers, providers, Wallet } from "ethers";
import { L1ArbitrumRouterLike, L1ArbitrumGatewayLike } from "./contracts";
export declare function getArbitrumGasPriceBid(l2: providers.Provider): Promise<BigNumber>;
export declare function getArbitrumMaxSubmissionPrice(l1: providers.Provider, calldataOrCalldataLength: string | number, inboxAddress: string): Promise<any>;
export declare function getArbitrumMaxGas(l2: ethers.providers.Provider, sender: string, destination: string, refundDestination: string, calldata: string): Promise<BigNumber>;
export declare function depositToArbitrumStandardBridge({ from, to, l1Provider, l2Provider, deposit, l1Gateway, inboxAddress, l1TokenAddress, l2GatewayAddress, }: {
    from: Wallet;
    to: string;
    l1Provider: ethers.providers.Provider;
    l2Provider: ethers.providers.Provider;
    deposit: BigNumber | string;
    l1Gateway: L1ArbitrumGatewayLike;
    inboxAddress: string;
    l1TokenAddress: string;
    l2GatewayAddress: string;
}): Promise<ethers.providers.TransactionReceipt>;
export declare function depositToArbitrumStandardRouter({ from, to, l1Provider, l2Provider, deposit, l1Gateway, l1Router, inboxAddress, l1TokenAddress, l2GatewayAddress, }: {
    from: Wallet;
    to: string;
    l1Provider: ethers.providers.Provider;
    l2Provider: ethers.providers.Provider;
    deposit: BigNumber | string;
    l1Router: L1ArbitrumRouterLike;
    l1Gateway: L1ArbitrumGatewayLike;
    inboxAddress: string;
    l1TokenAddress: string;
    l2GatewayAddress: string;
}): Promise<ethers.providers.TransactionReceipt>;
export declare function setArbitrumGatewayForToken({ l1Provider, l2Provider, l1Router, tokenGateway, inboxAddress, }: {
    l1Provider: ethers.providers.Provider;
    l2Provider: ethers.providers.Provider;
    l1Router: L1ArbitrumRouterLike;
    tokenGateway: L1ArbitrumGatewayLike;
    inboxAddress: string;
}): Promise<void>;
