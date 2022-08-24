"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getArbitrumGoerliTestnetSdk = exports.getOptimismGoerliTestnetSdk = exports.getGoerliSdk = exports.getArbitrumTestnetSdk = exports.getRinkebySdk = exports.getOptimismKovanSdk = exports.getKovanSdk = exports.getContract = void 0;
const ethers_1 = require("ethers");
const TeleportOracleAuth_json_1 = __importDefault(require("../../../eth-sdk/abis/kovan/KOVAN-MASTER-1/TeleportOracleAuth.json"));
const TeleportJoin_json_1 = __importDefault(require("../../../eth-sdk/abis/kovan/KOVAN-MASTER-1/TeleportJoin.json"));
const Vat_json_1 = __importDefault(require("../../../eth-sdk/abis/kovan/KOVAN-MASTER-1/Vat.json"));
const Multicall_json_1 = __importDefault(require("../../../eth-sdk/abis/kovan/KOVAN-MASTER-1/Multicall.json"));
const BasicRelay_json_1 = __importDefault(require("../../../eth-sdk/abis/kovan/KOVAN-MASTER-1/BasicRelay.json"));
const TrustedRelay_json_1 = __importDefault(require("../../../eth-sdk/abis/kovan/KOVAN-MASTER-1/TrustedRelay.json"));
const Dai_json_1 = __importDefault(require("../../../eth-sdk/abis/kovan/KOVAN-MASTER-1/Dai.json"));
const TeleportOutboundGateway_json_1 = __importDefault(require("../../../eth-sdk/abis/optimismKovan/KOVAN-SLAVE-OPTIMISM-1/TeleportOutboundGateway.json"));
const Faucet_json_1 = __importDefault(require("../../../eth-sdk/abis/optimismKovan/KOVAN-SLAVE-OPTIMISM-1/Faucet.json"));
const Dai_json_2 = __importDefault(require("../../../eth-sdk/abis/optimismKovan/KOVAN-SLAVE-OPTIMISM-1/Dai.json"));
const TeleportOracleAuth_json_2 = __importDefault(require("../../../eth-sdk/abis/rinkeby/RINKEBY-MASTER-1/TeleportOracleAuth.json"));
const TeleportJoin_json_2 = __importDefault(require("../../../eth-sdk/abis/rinkeby/RINKEBY-MASTER-1/TeleportJoin.json"));
const Vat_json_2 = __importDefault(require("../../../eth-sdk/abis/rinkeby/RINKEBY-MASTER-1/Vat.json"));
const Multicall_json_2 = __importDefault(require("../../../eth-sdk/abis/rinkeby/RINKEBY-MASTER-1/Multicall.json"));
const FakeOutbox_json_1 = __importDefault(require("../../../eth-sdk/abis/rinkeby/RINKEBY-MASTER-1/FakeOutbox.json"));
const BasicRelay_json_2 = __importDefault(require("../../../eth-sdk/abis/rinkeby/RINKEBY-MASTER-1/BasicRelay.json"));
const TrustedRelay_json_2 = __importDefault(require("../../../eth-sdk/abis/rinkeby/RINKEBY-MASTER-1/TrustedRelay.json"));
const Dai_json_3 = __importDefault(require("../../../eth-sdk/abis/rinkeby/RINKEBY-MASTER-1/Dai.json"));
const TeleportOutboundGateway_json_2 = __importDefault(require("../../../eth-sdk/abis/arbitrumTestnet/RINKEBY-SLAVE-ARBITRUM-1/TeleportOutboundGateway.json"));
const Faucet_json_2 = __importDefault(require("../../../eth-sdk/abis/arbitrumTestnet/RINKEBY-SLAVE-ARBITRUM-1/Faucet.json"));
const Dai_json_4 = __importDefault(require("../../../eth-sdk/abis/arbitrumTestnet/RINKEBY-SLAVE-ARBITRUM-1/Dai.json"));
const TeleportOracleAuth_json_3 = __importDefault(require("../../../eth-sdk/abis/goerli/ETH-GOER-A/TeleportOracleAuth.json"));
const TeleportJoin_json_3 = __importDefault(require("../../../eth-sdk/abis/goerli/ETH-GOER-A/TeleportJoin.json"));
const Vat_json_3 = __importDefault(require("../../../eth-sdk/abis/goerli/ETH-GOER-A/Vat.json"));
const Multicall_json_3 = __importDefault(require("../../../eth-sdk/abis/goerli/ETH-GOER-A/Multicall.json"));
const FakeOutbox_json_2 = __importDefault(require("../../../eth-sdk/abis/goerli/ETH-GOER-A/FakeOutbox.json"));
const BasicRelay_json_3 = __importDefault(require("../../../eth-sdk/abis/goerli/ETH-GOER-A/BasicRelay.json"));
const TrustedRelay_json_3 = __importDefault(require("../../../eth-sdk/abis/goerli/ETH-GOER-A/TrustedRelay.json"));
const Dai_json_5 = __importDefault(require("../../../eth-sdk/abis/goerli/ETH-GOER-A/Dai.json"));
const TeleportOutboundGateway_json_3 = __importDefault(require("../../../eth-sdk/abis/optimismGoerliTestnet/OPT-GOER-A/TeleportOutboundGateway.json"));
const Faucet_json_3 = __importDefault(require("../../../eth-sdk/abis/optimismGoerliTestnet/OPT-GOER-A/Faucet.json"));
const Dai_json_6 = __importDefault(require("../../../eth-sdk/abis/optimismGoerliTestnet/OPT-GOER-A/Dai.json"));
const TeleportOutboundGateway_json_4 = __importDefault(require("../../../eth-sdk/abis/arbitrumGoerliTestnet/ARB-GOER-A/TeleportOutboundGateway.json"));
const Faucet_json_4 = __importDefault(require("../../../eth-sdk/abis/arbitrumGoerliTestnet/ARB-GOER-A/Faucet.json"));
const Dai_json_7 = __importDefault(require("../../../eth-sdk/abis/arbitrumGoerliTestnet/ARB-GOER-A/Dai.json"));
function getContract(address, abi, defaultSigner) {
    return new ethers_1.Contract(address, abi, defaultSigner);
}
exports.getContract = getContract;
function getKovanSdk(defaultSigner) {
    return {
        "KOVAN-MASTER-1": {
            "TeleportOracleAuth": getContract('0x0b0D629e294Af96A6cc245a89A5CEa92C8Be9da4', TeleportOracleAuth_json_1.default, defaultSigner),
            "TeleportJoin": getContract('0x556D9076A42Bba1892E3F4cA331daE587185Cef9', TeleportJoin_json_1.default, defaultSigner),
            "Vat": getContract('0xbA987bDB501d131f766fEe8180Da5d81b34b69d9', Vat_json_1.default, defaultSigner),
            "Multicall": getContract('0xC6D81A2e375Eee15a20E6464b51c5FC6Bb949fdA', Multicall_json_1.default, defaultSigner),
            "BasicRelay": getContract('0x5B3363996Bd8164F07315faAf3F96B72D192382c', BasicRelay_json_1.default, defaultSigner),
            "TrustedRelay": getContract('0xAAFa36901AdC6C03df8B935fFA129677D1D7Eb81', TrustedRelay_json_1.default, defaultSigner),
            "Dai": getContract('0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa', Dai_json_1.default, defaultSigner),
        },
    };
}
exports.getKovanSdk = getKovanSdk;
function getOptimismKovanSdk(defaultSigner) {
    return {
        "KOVAN-SLAVE-OPTIMISM-1": {
            "TeleportOutboundGateway": getContract('0x0aeDbEf4105fdfc0db5A3Cd8C827bE2efA93ebe0', TeleportOutboundGateway_json_1.default, defaultSigner),
            "Faucet": getContract('0xDB66c86899967A3D9E4D77D7d2Bb703747aAEeA7', Faucet_json_1.default, defaultSigner),
            "Dai": getContract('0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', Dai_json_2.default, defaultSigner),
        },
    };
}
exports.getOptimismKovanSdk = getOptimismKovanSdk;
function getRinkebySdk(defaultSigner) {
    return {
        "RINKEBY-MASTER-1": {
            "TeleportOracleAuth": getContract('0x1E7722E502D3dCbB0704f99c75c99a5402598f13', TeleportOracleAuth_json_2.default, defaultSigner),
            "TeleportJoin": getContract('0x894DB23D804c626f1aAA89a2Bc3280052e6c4750', TeleportJoin_json_2.default, defaultSigner),
            "Vat": getContract('0x66b3D63621FDD5967603A824114Da95cc3A35107', Vat_json_2.default, defaultSigner),
            "Multicall": getContract('0x86d3b107386756208154a5c9100a0d4557280747', Multicall_json_2.default, defaultSigner),
            "FakeOutbox": getContract('0x4A2D3d40c14c10Df50a15A3f1359Fb0F5C893899', FakeOutbox_json_1.default, defaultSigner),
            "BasicRelay": getContract('0xC35787975484A858B878032B045B6E0B6EfE2e2c', BasicRelay_json_2.default, defaultSigner),
            "TrustedRelay": getContract('0xef4dF54E711e0d42754a12e85fD4186f8fF2c7A7', TrustedRelay_json_2.default, defaultSigner),
            "Dai": getContract('0x17B729a6Ac1f265090cbb4AecBdd53E34664C00e', Dai_json_3.default, defaultSigner),
        },
    };
}
exports.getRinkebySdk = getRinkebySdk;
function getArbitrumTestnetSdk(defaultSigner) {
    return {
        "RINKEBY-SLAVE-ARBITRUM-1": {
            "TeleportOutboundGateway": getContract('0x327c2f7aCd799f31535880Af54C2bCAB1384Ecc3', TeleportOutboundGateway_json_2.default, defaultSigner),
            "Faucet": getContract('0xc72cfA99ef0aec40334A2df3E70eB1028402cceE', Faucet_json_2.default, defaultSigner),
            "Dai": getContract('0x78e59654Bc33dBbFf9FfF83703743566B1a0eA15', Dai_json_4.default, defaultSigner),
        },
    };
}
exports.getArbitrumTestnetSdk = getArbitrumTestnetSdk;
function getGoerliSdk(defaultSigner) {
    return {
        "ETH-GOER-A": {
            "TeleportOracleAuth": getContract('0xe6c2b941d268cA7690c01F95Cd4bDD12360A0A4F', TeleportOracleAuth_json_3.default, defaultSigner),
            "TeleportJoin": getContract('0xd88310A476ee960487FDb2772CC4bd017dadEf6B', TeleportJoin_json_3.default, defaultSigner),
            "Vat": getContract('0x293D5AA7F26EF9A687880C4501871632d1015A82', Vat_json_3.default, defaultSigner),
            "Multicall": getContract('0xb8c864B60e9467398800Df34da39BF4f0c459461', Multicall_json_3.default, defaultSigner),
            "FakeOutbox": getContract('0x95637Cabe684a324A8225C4b6Ce880D70074938d', FakeOutbox_json_2.default, defaultSigner),
            "BasicRelay": getContract('0x0Cb8747982d99f4b8640EE27330ADD0c2b54d0e6', BasicRelay_json_3.default, defaultSigner),
            "TrustedRelay": getContract('0xB23Ab27F7B59B718ea1eEF536F66e1Db3F18ac8E', TrustedRelay_json_3.default, defaultSigner),
            "Dai": getContract('0x0089Ed33ED517F58a064D0ef56C9E89Dc01EE9A2', Dai_json_5.default, defaultSigner),
        },
    };
}
exports.getGoerliSdk = getGoerliSdk;
function getOptimismGoerliTestnetSdk(defaultSigner) {
    return {
        "OPT-GOER-A": {
            "TeleportOutboundGateway": getContract('0xFF660111D2C6887D8F24B5378cceDbf465B33B6F', TeleportOutboundGateway_json_3.default, defaultSigner),
            "Faucet": getContract('0xD9e08dc985012296b9A80BEf4a587Ad72288D986', Faucet_json_3.default, defaultSigner),
            "Dai": getContract('0x8ea903081aa1137F11D51F64A1F372EDe67571a9', Dai_json_6.default, defaultSigner),
        },
    };
}
exports.getOptimismGoerliTestnetSdk = getOptimismGoerliTestnetSdk;
function getArbitrumGoerliTestnetSdk(defaultSigner) {
    return {
        "ARB-GOER-A": {
            "TeleportOutboundGateway": getContract('0xb586c1D27Ee93329B1da48B8F7F4436C173FCef8', TeleportOutboundGateway_json_4.default, defaultSigner),
            "Faucet": getContract('0x9031Ab810C496FCF09B65851c736E9a37983B963', Faucet_json_4.default, defaultSigner),
            "Dai": getContract('0x8ea903081aa1137F11D51F64A1F372EDe67571a9', Dai_json_7.default, defaultSigner),
        },
    };
}
exports.getArbitrumGoerliTestnetSdk = getArbitrumGoerliTestnetSdk;
