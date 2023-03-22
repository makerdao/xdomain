import { Signer } from 'ethers';
import * as types from './types';
export declare function getContract(address: string, abi: object, defaultSigner: Signer): any;
export declare type MainnetSdk = ReturnType<typeof getMainnetSdk>;
export declare function getMainnetSdk(defaultSigner: Signer): {
    "ETH-MAIN-A": {
        TeleportOracleAuth: types.TeleportOracleAuth;
        TeleportJoin: types.TeleportJoin;
        Vat: types.Vat;
        Multicall: types.Multicall;
        BasicRelay: types.BasicRelay;
        TrustedRelay: types.TrustedRelay;
        Dai: types.Dai;
    };
};
export declare type OptimismSdk = ReturnType<typeof getOptimismSdk>;
export declare function getOptimismSdk(defaultSigner: Signer): {
    "OPT-MAIN-A": {
        TeleportOutboundGateway: types.TeleportOutboundGateway;
        Dai: types.Dai;
    };
};
export declare type ArbitrumOneSdk = ReturnType<typeof getArbitrumOneSdk>;
export declare function getArbitrumOneSdk(defaultSigner: Signer): {
    "ARB-ONE-A": {
        TeleportOutboundGateway: types.TeleportOutboundGateway;
        Dai: types.Dai;
    };
};
export declare type GoerliSdk = ReturnType<typeof getGoerliSdk>;
export declare function getGoerliSdk(defaultSigner: Signer): {
    "ETH-GOER-A": {
        TeleportOracleAuth: types.TeleportOracleAuth;
        TeleportJoin: types.TeleportJoin;
        Vat: types.Vat;
        Multicall: types.Multicall;
        BasicRelay: types.BasicRelay;
        TrustedRelay: types.TrustedRelay;
        Dai: types.Dai;
    };
};
export declare type OptimismGoerliTestnetSdk = ReturnType<typeof getOptimismGoerliTestnetSdk>;
export declare function getOptimismGoerliTestnetSdk(defaultSigner: Signer): {
    "OPT-GOER-A": {
        TeleportOutboundGateway: types.TeleportOutboundGateway;
        Faucet: types.Faucet;
        Dai: types.Dai;
    };
};
export declare type ArbitrumGoerliTestnetSdk = ReturnType<typeof getArbitrumGoerliTestnetSdk>;
export declare function getArbitrumGoerliTestnetSdk(defaultSigner: Signer): {
    "ARB-GOER-A": {
        TeleportOutboundGateway: types.TeleportOutboundGateway;
        Faucet: types.Faucet;
        Dai: types.Dai;
    };
};
