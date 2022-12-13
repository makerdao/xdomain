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
/**
 * Teleport's supported domains
 */
export declare const DOMAINS: readonly ["RINKEBY-SLAVE-ARBITRUM-1", "RINKEBY-MASTER-1", "KOVAN-SLAVE-OPTIMISM-1", "KOVAN-MASTER-1", "OPT-GOER-A", "ARB-GOER-A", "ETH-GOER-A", "OPT-MAIN-A", "ARB-ONE-A", "ETH-MAIN-A"];
export declare type DomainId = typeof DOMAINS[number];
export declare const DOMAIN_CHAIN_IDS: {
    [domain in DomainId]: number;
};
export declare const DEFAULT_RPC_URLS: Dictionary<string, DomainId>;
/**
 * Accepted aliases for domains
 */
export declare type DomainDescription = DomainId | 'optimism-testnet' | 'arbitrum-testnet' | 'optimism-goerli-testnet' | 'arbitrum-goerli-testnet' | 'optimism' | 'arbitrum';
/**
 * Convert a domain alias into its {@link DomainId}
 * @public
 * @param srcDomain - domain alias from {@link DomainDescription}
 * @returns the un-aliased {@link DomainId}
 */
export declare function getLikelyDomainId(srcDomain: DomainDescription): DomainId;
/**
 * Get the default target domain for a given source domain
 * @remarks
 * This usually means L2 -> L1 for rollup chains on Ethereum
 * @public
 * @param srcDomain - source domain's {@link DomainId}
 * @returns target domain's {@link DomainId}
 */
export declare function getDefaultDstDomain(srcDomain: DomainDescription): DomainId;
/**
 * Get an ethers.js bundle containing contracts and a provider connected to a given domain
 * @param domain - domain to connect to
 * @param signerOrProvider - ethers.js signer or provider for the given domain
 * @returns
 */
export declare function getSdk(domain: DomainDescription, signerOrProvider: Signer | Provider): TeleportSdk;
//# sourceMappingURL=domains.d.ts.map