"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getArbitrumGoerliTestnetSdk = exports.getOptimismGoerliTestnetSdk = exports.getGoerliSdk = exports.getArbitrumOneSdk = exports.getOptimismSdk = exports.getMainnetSdk = exports.getContract = void 0;
const ethers_1 = require("ethers");
const TeleportOracleAuth_json_1 = __importDefault(require("../../eth-sdk/abis/mainnet/ETH-MAIN-A/TeleportOracleAuth.json"));
const TeleportJoin_json_1 = __importDefault(require("../../eth-sdk/abis/mainnet/ETH-MAIN-A/TeleportJoin.json"));
const Vat_json_1 = __importDefault(require("../../eth-sdk/abis/mainnet/ETH-MAIN-A/Vat.json"));
const Multicall_json_1 = __importDefault(require("../../eth-sdk/abis/mainnet/ETH-MAIN-A/Multicall.json"));
const BasicRelay_json_1 = __importDefault(require("../../eth-sdk/abis/mainnet/ETH-MAIN-A/BasicRelay.json"));
const TrustedRelay_json_1 = __importDefault(require("../../eth-sdk/abis/mainnet/ETH-MAIN-A/TrustedRelay.json"));
const Dai_json_1 = __importDefault(require("../../eth-sdk/abis/mainnet/ETH-MAIN-A/Dai.json"));
const TeleportOutboundGateway_json_1 = __importDefault(require("../../eth-sdk/abis/optimism/OPT-MAIN-A/TeleportOutboundGateway.json"));
const Dai_json_2 = __importDefault(require("../../eth-sdk/abis/optimism/OPT-MAIN-A/Dai.json"));
const TeleportOutboundGateway_json_2 = __importDefault(require("../../eth-sdk/abis/arbitrumOne/ARB-ONE-A/TeleportOutboundGateway.json"));
const Dai_json_3 = __importDefault(require("../../eth-sdk/abis/arbitrumOne/ARB-ONE-A/Dai.json"));
const TeleportOracleAuth_json_2 = __importDefault(require("../../eth-sdk/abis/goerli/ETH-GOER-A/TeleportOracleAuth.json"));
const TeleportJoin_json_2 = __importDefault(require("../../eth-sdk/abis/goerli/ETH-GOER-A/TeleportJoin.json"));
const Vat_json_2 = __importDefault(require("../../eth-sdk/abis/goerli/ETH-GOER-A/Vat.json"));
const Multicall_json_2 = __importDefault(require("../../eth-sdk/abis/goerli/ETH-GOER-A/Multicall.json"));
const BasicRelay_json_2 = __importDefault(require("../../eth-sdk/abis/goerli/ETH-GOER-A/BasicRelay.json"));
const TrustedRelay_json_2 = __importDefault(require("../../eth-sdk/abis/goerli/ETH-GOER-A/TrustedRelay.json"));
const Dai_json_4 = __importDefault(require("../../eth-sdk/abis/goerli/ETH-GOER-A/Dai.json"));
const TeleportOutboundGateway_json_3 = __importDefault(require("../../eth-sdk/abis/optimismGoerliTestnet/OPT-GOER-A/TeleportOutboundGateway.json"));
const Faucet_json_1 = __importDefault(require("../../eth-sdk/abis/optimismGoerliTestnet/OPT-GOER-A/Faucet.json"));
const Dai_json_5 = __importDefault(require("../../eth-sdk/abis/optimismGoerliTestnet/OPT-GOER-A/Dai.json"));
const TeleportOutboundGateway_json_4 = __importDefault(require("../../eth-sdk/abis/arbitrumGoerliTestnet/ARB-GOER-A/TeleportOutboundGateway.json"));
const Faucet_json_2 = __importDefault(require("../../eth-sdk/abis/arbitrumGoerliTestnet/ARB-GOER-A/Faucet.json"));
const Dai_json_6 = __importDefault(require("../../eth-sdk/abis/arbitrumGoerliTestnet/ARB-GOER-A/Dai.json"));
function getContract(address, abi, defaultSigner) {
    return new ethers_1.Contract(address, abi, defaultSigner);
}
exports.getContract = getContract;
function getMainnetSdk(defaultSigner) {
    return {
        "ETH-MAIN-A": {
            "TeleportOracleAuth": getContract('0x324a895625E7AE38Fc7A6ae91a71e7E937Caa7e6', TeleportOracleAuth_json_1.default, defaultSigner),
            "TeleportJoin": getContract('0x41Ca7a7Aa2Be78Cf7CB80C0F4a9bdfBC96e81815', TeleportJoin_json_1.default, defaultSigner),
            "Vat": getContract('0x35D1b3F3D7966A1DFe207aa4514C12a259A0492B', Vat_json_1.default, defaultSigner),
            "Multicall": getContract('0x5e227AD1969Ea493B43F840cfF78d08a6fc17796', Multicall_json_1.default, defaultSigner),
            "BasicRelay": getContract('0x0b627300c5f06C5510243081fc66868A0F440d62', BasicRelay_json_1.default, defaultSigner),
            "TrustedRelay": getContract('0xFabFEd371884ddBd4704867484EB0B419C7fC967', TrustedRelay_json_1.default, defaultSigner),
            "Dai": getContract('0x6B175474E89094C44Da98b954EedeAC495271d0F', Dai_json_1.default, defaultSigner),
        },
    };
}
exports.getMainnetSdk = getMainnetSdk;
function getOptimismSdk(defaultSigner) {
    return {
        "OPT-MAIN-A": {
            "TeleportOutboundGateway": getContract('0x18d2CF2296c5b29343755E6B7e37679818913f88', TeleportOutboundGateway_json_1.default, defaultSigner),
            "Dai": getContract('0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', Dai_json_2.default, defaultSigner),
        },
    };
}
exports.getOptimismSdk = getOptimismSdk;
function getArbitrumOneSdk(defaultSigner) {
    return {
        "ARB-ONE-A": {
            "TeleportOutboundGateway": getContract('0x5dBaf6F2bEDebd414F8d78d13499222347e59D5E', TeleportOutboundGateway_json_2.default, defaultSigner),
            "Dai": getContract('0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', Dai_json_3.default, defaultSigner),
        },
    };
}
exports.getArbitrumOneSdk = getArbitrumOneSdk;
function getGoerliSdk(defaultSigner) {
    return {
        "ETH-GOER-A": {
            "TeleportOracleAuth": getContract('0x29d292E0773E484dbcA8626F432985630175763b', TeleportOracleAuth_json_2.default, defaultSigner),
            "TeleportJoin": getContract('0xE2fddf4e0f5A4B6d0Cc1D162FBFbEF7B6c5D6f69', TeleportJoin_json_2.default, defaultSigner),
            "Vat": getContract('0xB966002DDAa2Baf48369f5015329750019736031', Vat_json_2.default, defaultSigner),
            "Multicall": getContract('0xb8c864B60e9467398800Df34da39BF4f0c459461', Multicall_json_2.default, defaultSigner),
            "BasicRelay": getContract('0x238a2523B3F211c4099517579B951347c5E5BF55', BasicRelay_json_2.default, defaultSigner),
            "TrustedRelay": getContract('0x54Aa25B69a3D73A15D21A01a9943E63BAa4c1c58', TrustedRelay_json_2.default, defaultSigner),
            "Dai": getContract('0x11fE4B6AE13d2a6055C8D9cF65c55bac32B5d844', Dai_json_4.default, defaultSigner),
        },
    };
}
exports.getGoerliSdk = getGoerliSdk;
function getOptimismGoerliTestnetSdk(defaultSigner) {
    return {
        "OPT-GOER-A": {
            "TeleportOutboundGateway": getContract('0xd9e000C419F3aA4EA1C519497f5aF249b496a00f', TeleportOutboundGateway_json_3.default, defaultSigner),
            "Faucet": getContract('0xD9e08dc985012296b9A80BEf4a587Ad72288D986', Faucet_json_1.default, defaultSigner),
            "Dai": getContract('0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', Dai_json_5.default, defaultSigner),
        },
    };
}
exports.getOptimismGoerliTestnetSdk = getOptimismGoerliTestnetSdk;
function getArbitrumGoerliTestnetSdk(defaultSigner) {
    return {
        "ARB-GOER-A": {
            "TeleportOutboundGateway": getContract('0x8334a747731Be3a58bCcAf9a3D35EbC968806223', TeleportOutboundGateway_json_4.default, defaultSigner),
            "Faucet": getContract('0x9031Ab810C496FCF09B65851c736E9a37983B963', Faucet_json_2.default, defaultSigner),
            "Dai": getContract('0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', Dai_json_6.default, defaultSigner),
        },
    };
}
exports.getArbitrumGoerliTestnetSdk = getArbitrumGoerliTestnetSdk;
