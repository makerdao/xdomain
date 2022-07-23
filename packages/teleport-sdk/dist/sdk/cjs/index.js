"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getArbitrumTestnetSdk = exports.getRinkebySdk = exports.getOptimismKovanSdk = exports.getKovanSdk = exports.getContract = void 0;
const ethers_1 = require("ethers");
const TeleportOracleAuth_json_1 = __importDefault(require("../../../eth-sdk/abis/kovan/KOVAN-MASTER-1/TeleportOracleAuth.json"));
const TeleportJoin_json_1 = __importDefault(require("../../../eth-sdk/abis/kovan/KOVAN-MASTER-1/TeleportJoin.json"));
const Vat_json_1 = __importDefault(require("../../../eth-sdk/abis/kovan/KOVAN-MASTER-1/Vat.json"));
const Multicall_json_1 = __importDefault(require("../../../eth-sdk/abis/kovan/KOVAN-MASTER-1/Multicall.json"));
const BasicRelay_json_1 = __importDefault(require("../../../eth-sdk/abis/kovan/KOVAN-MASTER-1/BasicRelay.json"));
const TrustedRelay_json_1 = __importDefault(require("../../../eth-sdk/abis/kovan/KOVAN-MASTER-1/TrustedRelay.json"));
const TeleportOutboundGateway_json_1 = __importDefault(require("../../../eth-sdk/abis/optimismKovan/KOVAN-SLAVE-OPTIMISM-1/TeleportOutboundGateway.json"));
const Faucet_json_1 = __importDefault(require("../../../eth-sdk/abis/optimismKovan/KOVAN-SLAVE-OPTIMISM-1/Faucet.json"));
const TeleportOracleAuth_json_2 = __importDefault(require("../../../eth-sdk/abis/rinkeby/RINKEBY-MASTER-1/TeleportOracleAuth.json"));
const TeleportJoin_json_2 = __importDefault(require("../../../eth-sdk/abis/rinkeby/RINKEBY-MASTER-1/TeleportJoin.json"));
const Vat_json_2 = __importDefault(require("../../../eth-sdk/abis/rinkeby/RINKEBY-MASTER-1/Vat.json"));
const Multicall_json_2 = __importDefault(require("../../../eth-sdk/abis/rinkeby/RINKEBY-MASTER-1/Multicall.json"));
const FakeOutbox_json_1 = __importDefault(require("../../../eth-sdk/abis/rinkeby/RINKEBY-MASTER-1/FakeOutbox.json"));
const Outbox_json_1 = __importDefault(require("../../../eth-sdk/abis/rinkeby/RINKEBY-MASTER-1/Outbox.json"));
const BasicRelay_json_2 = __importDefault(require("../../../eth-sdk/abis/rinkeby/RINKEBY-MASTER-1/BasicRelay.json"));
const TrustedRelay_json_2 = __importDefault(require("../../../eth-sdk/abis/rinkeby/RINKEBY-MASTER-1/TrustedRelay.json"));
const TeleportOutboundGateway_json_2 = __importDefault(require("../../../eth-sdk/abis/arbitrumTestnet/RINKEBY-SLAVE-ARBITRUM-1/TeleportOutboundGateway.json"));
const Faucet_json_2 = __importDefault(require("../../../eth-sdk/abis/arbitrumTestnet/RINKEBY-SLAVE-ARBITRUM-1/Faucet.json"));
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
        },
    };
}
exports.getKovanSdk = getKovanSdk;
function getOptimismKovanSdk(defaultSigner) {
    return {
        "KOVAN-SLAVE-OPTIMISM-1": {
            "TeleportOutboundGateway": getContract('0x0aeDbEf4105fdfc0db5A3Cd8C827bE2efA93ebe0', TeleportOutboundGateway_json_1.default, defaultSigner),
            "Faucet": getContract('0xDB66c86899967A3D9E4D77D7d2Bb703747aAEeA7', Faucet_json_1.default, defaultSigner),
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
            "Outbox": getContract('0x2360A33905dc1c72b12d975d975F42BaBdcef9F3', Outbox_json_1.default, defaultSigner),
            "BasicRelay": getContract('0xC35787975484A858B878032B045B6E0B6EfE2e2c', BasicRelay_json_2.default, defaultSigner),
            "TrustedRelay": getContract('0xef4dF54E711e0d42754a12e85fD4186f8fF2c7A7', TrustedRelay_json_2.default, defaultSigner),
        },
    };
}
exports.getRinkebySdk = getRinkebySdk;
function getArbitrumTestnetSdk(defaultSigner) {
    return {
        "RINKEBY-SLAVE-ARBITRUM-1": {
            "TeleportOutboundGateway": getContract('0x327c2f7aCd799f31535880Af54C2bCAB1384Ecc3', TeleportOutboundGateway_json_2.default, defaultSigner),
            "Faucet": getContract('0xc72cfA99ef0aec40334A2df3E70eB1028402cceE', Faucet_json_2.default, defaultSigner),
        },
    };
}
exports.getArbitrumTestnetSdk = getArbitrumTestnetSdk;
