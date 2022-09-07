import { Provider } from '@ethersproject/abstract-provider';
import { Signer } from 'ethers';
import { Dictionary } from 'ts-essentials';
import { BasicRelay, Dai, Faucet, Multicall, TeleportJoin, TeleportOracleAuth, TeleportOutboundGateway, TrustedRelay, Vat } from './sdk/esm/types';
export interface TeleportSdk {
    TeleportOracleAuth?: TeleportOracleAuth;
    TeleportJoin?: TeleportJoin;
    TeleportOutboundGateway?: TeleportOutboundGateway;
    Vat?: Vat;
    Multicall?: Multicall;
    Faucet?: Faucet;
    BasicRelay?: BasicRelay;
    TrustedRelay?: TrustedRelay;
    Dai?: Dai;
}
export declare const DOMAINS: readonly ["RINKEBY-SLAVE-ARBITRUM-1", "RINKEBY-MASTER-1", "KOVAN-SLAVE-OPTIMISM-1", "KOVAN-MASTER-1", "OPT-GOER-A", "ARB-GOER-A", "ETH-GOER-A", "OPT-MAIN-A", "ARB-ONE-A", "ETH-MAIN-A"];
export declare type DomainId = typeof DOMAINS[number];
export declare const DEFAULT_RPC_URLS: Dictionary<string, DomainId>;
export declare type DomainDescription = DomainId | 'optimism-testnet' | 'arbitrum-testnet' | 'optimism-goerli-testnet' | 'arbitrum-goerli-testnet' | 'optimism' | 'arbitrum';
export declare function getLikelyDomainId(srcDomain: DomainDescription): DomainId;
export declare function getDefaultDstDomain(srcDomain: DomainDescription): DomainId;
export declare function getSdk(domain: DomainDescription, signerOrProvider: Signer | Provider): TeleportSdk;
