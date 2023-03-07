"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSdk = exports.getDefaultDstDomain = exports.getLikelyDomainId = exports.DEFAULT_RPC_URLS = exports.DOMAINS = void 0;
const ethers_1 = require("ethers");
const sdk_1 = require("./sdk");
exports.DOMAINS = [
    'RINKEBY-SLAVE-ARBITRUM-1',
    'RINKEBY-MASTER-1',
    'KOVAN-SLAVE-OPTIMISM-1',
    'KOVAN-MASTER-1',
    'OPT-GOER-A',
    'ARB-GOER-A',
    'ETH-GOER-A',
    // 'OPT-MAIN-A',
    // 'ARB-MAIN-A',
    // 'ETH-MAIN-A',
];
exports.DEFAULT_RPC_URLS = {
    'RINKEBY-SLAVE-ARBITRUM-1': 'https://rinkeby.arbitrum.io/rpc',
    'RINKEBY-MASTER-1': 'https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    'KOVAN-SLAVE-OPTIMISM-1': 'https://kovan.optimism.io/',
    'KOVAN-MASTER-1': 'https://kovan.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    'OPT-GOER-A': 'https://goerli.optimism.io',
    'ARB-GOER-A': 'https://goerli-rollup.arbitrum.io/rpc',
    'ETH-GOER-A': 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    //   "OPT-MAIN-A": "https://optimism.io/",
    //   "ARB-ONE-A": "https://arb1.arbitrum.io/rpc",
    //   "ETH-MAIN-A": "https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
};
const descriptionsToDomainIds = {
    'arbitrum-testnet': 'RINKEBY-SLAVE-ARBITRUM-1',
    'optimism-testnet': 'KOVAN-SLAVE-OPTIMISM-1',
    'arbitrum-goerli-testnet': 'ARB-GOER-A',
    'optimism-goerli-testnet': 'OPT-GOER-A',
    ...Object.assign({}, ...exports.DOMAINS.map((d) => ({ [d]: d }))),
};
function getLikelyDomainId(srcDomain) {
    return descriptionsToDomainIds[srcDomain];
}
exports.getLikelyDomainId = getLikelyDomainId;
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
    throw new Error(`No default destination domain for source domain "${srcDomain}"`);
}
exports.getDefaultDstDomain = getDefaultDstDomain;
function getSdk(domain, signerOrProvider) {
    const sdkProviders = {
        'RINKEBY-MASTER-1': sdk_1.getRinkebySdk,
        'RINKEBY-SLAVE-ARBITRUM-1': sdk_1.getArbitrumTestnetSdk,
        'KOVAN-MASTER-1': sdk_1.getKovanSdk,
        'KOVAN-SLAVE-OPTIMISM-1': sdk_1.getOptimismKovanSdk,
        'OPT-GOER-A': sdk_1.getOptimismGoerliTestnetSdk,
        'ARB-GOER-A': sdk_1.getArbitrumGoerliTestnetSdk,
        'ETH-GOER-A': sdk_1.getGoerliSdk,
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