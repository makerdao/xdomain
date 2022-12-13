"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSdk = exports.getDefaultDstDomain = exports.getLikelyDomainId = exports.DEFAULT_RPC_URLS = exports.DOMAIN_CHAIN_IDS = exports.DOMAINS = void 0;
const ethers_1 = require("ethers");
const sdk_1 = require("./sdk");
/**
 * Teleport's supported domains
 */
exports.DOMAINS = [
    'RINKEBY-SLAVE-ARBITRUM-1',
    'RINKEBY-MASTER-1',
    'KOVAN-SLAVE-OPTIMISM-1',
    'KOVAN-MASTER-1',
    'OPT-GOER-A',
    'ARB-GOER-A',
    'ETH-GOER-A',
    'OPT-MAIN-A',
    'ARB-ONE-A',
    'ETH-MAIN-A',
];
exports.DOMAIN_CHAIN_IDS = {
    'RINKEBY-SLAVE-ARBITRUM-1': 421611,
    'RINKEBY-MASTER-1': 4,
    'KOVAN-SLAVE-OPTIMISM-1': 69,
    'KOVAN-MASTER-1': 42,
    'OPT-GOER-A': 420,
    'ARB-GOER-A': 421613,
    'ETH-GOER-A': 5,
    'OPT-MAIN-A': 10,
    'ARB-ONE-A': 42161,
    'ETH-MAIN-A': 1,
};
exports.DEFAULT_RPC_URLS = {
    'RINKEBY-SLAVE-ARBITRUM-1': 'https://rinkeby.arbitrum.io/rpc',
    'RINKEBY-MASTER-1': 'https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    'KOVAN-SLAVE-OPTIMISM-1': 'https://kovan.optimism.io/',
    'KOVAN-MASTER-1': 'https://kovan.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    'OPT-GOER-A': 'https://goerli.optimism.io',
    'ARB-GOER-A': 'https://goerli-rollup.arbitrum.io/rpc',
    'ETH-GOER-A': 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    'OPT-MAIN-A': 'https://mainnet.optimism.io/',
    'ARB-ONE-A': 'https://arb1.arbitrum.io/rpc',
    'ETH-MAIN-A': 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
};
/**
 * Conversion table for domain aliases
 */
const descriptionsToDomainIds = {
    'optimism-testnet': 'KOVAN-SLAVE-OPTIMISM-1',
    'arbitrum-testnet': 'RINKEBY-SLAVE-ARBITRUM-1',
    'optimism-goerli-testnet': 'OPT-GOER-A',
    'arbitrum-goerli-testnet': 'ARB-GOER-A',
    optimism: 'OPT-MAIN-A',
    arbitrum: 'ARB-ONE-A',
    ...Object.assign({}, ...exports.DOMAINS.map((d) => ({ [d]: d }))),
};
/**
 * Convert a domain alias into its {@link DomainId}
 * @public
 * @param srcDomain - domain alias from {@link DomainDescription}
 * @returns the un-aliased {@link DomainId}
 */
function getLikelyDomainId(srcDomain) {
    return descriptionsToDomainIds[srcDomain];
}
exports.getLikelyDomainId = getLikelyDomainId;
/**
 * Get the default target domain for a given source domain
 * @remarks
 * This usually means L2 -> L1 for rollup chains on Ethereum
 * @public
 * @param srcDomain - source domain's {@link DomainId}
 * @returns target domain's {@link DomainId}
 */
function getDefaultDstDomain(srcDomain) {
    const domainId = getLikelyDomainId(srcDomain);
    if (domainId.includes('KOVAN')) {
        return 'KOVAN-MASTER-1';
    }
    if (domainId.includes('RINKEBY')) {
        return 'RINKEBY-MASTER-1';
    }
    if (domainId.includes('GOER')) {
        return 'ETH-GOER-A';
    }
    if (domainId.includes('MAIN') || domainId === 'ARB-ONE-A') {
        return 'ETH-MAIN-A';
    }
    throw new Error(`No default destination domain for source domain "${srcDomain}"`);
}
exports.getDefaultDstDomain = getDefaultDstDomain;
/**
 * Get an ethers.js bundle containing contracts and a provider connected to a given domain
 * @param domain - domain to connect to
 * @param signerOrProvider - ethers.js signer or provider for the given domain
 * @returns
 */
function getSdk(domain, signerOrProvider) {
    const sdkProviders = {
        'RINKEBY-MASTER-1': sdk_1.getRinkebySdk,
        'RINKEBY-SLAVE-ARBITRUM-1': sdk_1.getArbitrumTestnetSdk,
        'KOVAN-MASTER-1': sdk_1.getKovanSdk,
        'KOVAN-SLAVE-OPTIMISM-1': sdk_1.getOptimismKovanSdk,
        'OPT-GOER-A': sdk_1.getOptimismGoerliTestnetSdk,
        'ARB-GOER-A': sdk_1.getArbitrumGoerliTestnetSdk,
        'ETH-GOER-A': sdk_1.getGoerliSdk,
        'OPT-MAIN-A': sdk_1.getOptimismSdk,
        'ARB-ONE-A': sdk_1.getArbitrumOneSdk,
        'ETH-MAIN-A': sdk_1.getMainnetSdk,
    };
    const domainId = getLikelyDomainId(domain);
    const signer = signerOrProvider;
    if (!signer.provider && signer.connect) {
        signerOrProvider = signer.connect(new ethers_1.providers.JsonRpcProvider(exports.DEFAULT_RPC_URLS[domainId]));
    }
    const sdk = sdkProviders[domainId](signerOrProvider)[domainId];
    const res = {
        TeleportOracleAuth: undefined,
        TeleportJoin: undefined,
        TeleportOutboundGateway: undefined,
        Vat: undefined,
        Multicall: undefined,
        Faucet: undefined,
        BasicRelay: undefined,
        TrustedRelay: undefined,
        Dai: undefined,
        ...sdk,
    };
    return res;
}
exports.getSdk = getSdk;
//# sourceMappingURL=domains.js.map