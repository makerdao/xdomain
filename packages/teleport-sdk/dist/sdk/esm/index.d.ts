import { Signer } from 'ethers';
import * as types from './types';
export declare function getContract(address: string, abi: object, defaultSigner: Signer): any;
export declare type KovanSdk = ReturnType<typeof getKovanSdk>;
export declare function getKovanSdk(defaultSigner: Signer): {
    "KOVAN-MASTER-1": {
        TeleportOracleAuth: types.TeleportOracleAuth;
        TeleportJoin: types.TeleportJoin;
        Vat: types.Vat;
        Multicall: types.Multicall;
        BasicRelay: types.BasicRelay;
        TrustedRelay: types.TrustedRelay;
    };
};
export declare type OptimismKovanSdk = ReturnType<typeof getOptimismKovanSdk>;
export declare function getOptimismKovanSdk(defaultSigner: Signer): {
    "KOVAN-SLAVE-OPTIMISM-1": {
        TeleportOutboundGateway: types.TeleportOutboundGateway;
        Faucet: types.Faucet;
    };
};
export declare type RinkebySdk = ReturnType<typeof getRinkebySdk>;
export declare function getRinkebySdk(defaultSigner: Signer): {
    "RINKEBY-MASTER-1": {
        TeleportOracleAuth: types.TeleportOracleAuth;
        TeleportJoin: types.TeleportJoin;
        Vat: types.Vat;
        Multicall: types.Multicall;
        FakeOutbox: types.FakeOutbox;
        Outbox: types.Outbox;
        BasicRelay: types.BasicRelay;
        TrustedRelay: types.TrustedRelay;
    };
};
export declare type ArbitrumTestnetSdk = ReturnType<typeof getArbitrumTestnetSdk>;
export declare function getArbitrumTestnetSdk(defaultSigner: Signer): {
    "RINKEBY-SLAVE-ARBITRUM-1": {
        TeleportOutboundGateway: types.TeleportOutboundGateway;
        Faucet: types.Faucet;
    };
};
