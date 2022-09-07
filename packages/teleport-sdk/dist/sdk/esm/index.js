import { Contract } from 'ethers';
import kovanKOVANMASTER1TeleportOracleAuthAbi from '../../../eth-sdk/abis/kovan/KOVAN-MASTER-1/TeleportOracleAuth.json';
import kovanKOVANMASTER1TeleportJoinAbi from '../../../eth-sdk/abis/kovan/KOVAN-MASTER-1/TeleportJoin.json';
import kovanKOVANMASTER1VatAbi from '../../../eth-sdk/abis/kovan/KOVAN-MASTER-1/Vat.json';
import kovanKOVANMASTER1MulticallAbi from '../../../eth-sdk/abis/kovan/KOVAN-MASTER-1/Multicall.json';
import kovanKOVANMASTER1BasicRelayAbi from '../../../eth-sdk/abis/kovan/KOVAN-MASTER-1/BasicRelay.json';
import kovanKOVANMASTER1TrustedRelayAbi from '../../../eth-sdk/abis/kovan/KOVAN-MASTER-1/TrustedRelay.json';
import kovanKOVANMASTER1DaiAbi from '../../../eth-sdk/abis/kovan/KOVAN-MASTER-1/Dai.json';
import optimismKovanKOVANSLAVEOPTIMISM1TeleportOutboundGatewayAbi from '../../../eth-sdk/abis/optimismKovan/KOVAN-SLAVE-OPTIMISM-1/TeleportOutboundGateway.json';
import optimismKovanKOVANSLAVEOPTIMISM1FaucetAbi from '../../../eth-sdk/abis/optimismKovan/KOVAN-SLAVE-OPTIMISM-1/Faucet.json';
import optimismKovanKOVANSLAVEOPTIMISM1DaiAbi from '../../../eth-sdk/abis/optimismKovan/KOVAN-SLAVE-OPTIMISM-1/Dai.json';
import rinkebyRINKEBYMASTER1TeleportOracleAuthAbi from '../../../eth-sdk/abis/rinkeby/RINKEBY-MASTER-1/TeleportOracleAuth.json';
import rinkebyRINKEBYMASTER1TeleportJoinAbi from '../../../eth-sdk/abis/rinkeby/RINKEBY-MASTER-1/TeleportJoin.json';
import rinkebyRINKEBYMASTER1VatAbi from '../../../eth-sdk/abis/rinkeby/RINKEBY-MASTER-1/Vat.json';
import rinkebyRINKEBYMASTER1MulticallAbi from '../../../eth-sdk/abis/rinkeby/RINKEBY-MASTER-1/Multicall.json';
import rinkebyRINKEBYMASTER1FakeOutboxAbi from '../../../eth-sdk/abis/rinkeby/RINKEBY-MASTER-1/FakeOutbox.json';
import rinkebyRINKEBYMASTER1BasicRelayAbi from '../../../eth-sdk/abis/rinkeby/RINKEBY-MASTER-1/BasicRelay.json';
import rinkebyRINKEBYMASTER1TrustedRelayAbi from '../../../eth-sdk/abis/rinkeby/RINKEBY-MASTER-1/TrustedRelay.json';
import rinkebyRINKEBYMASTER1DaiAbi from '../../../eth-sdk/abis/rinkeby/RINKEBY-MASTER-1/Dai.json';
import arbitrumTestnetRINKEBYSLAVEARBITRUM1TeleportOutboundGatewayAbi from '../../../eth-sdk/abis/arbitrumTestnet/RINKEBY-SLAVE-ARBITRUM-1/TeleportOutboundGateway.json';
import arbitrumTestnetRINKEBYSLAVEARBITRUM1FaucetAbi from '../../../eth-sdk/abis/arbitrumTestnet/RINKEBY-SLAVE-ARBITRUM-1/Faucet.json';
import arbitrumTestnetRINKEBYSLAVEARBITRUM1DaiAbi from '../../../eth-sdk/abis/arbitrumTestnet/RINKEBY-SLAVE-ARBITRUM-1/Dai.json';
import goerliETHGOERATeleportOracleAuthAbi from '../../../eth-sdk/abis/goerli/ETH-GOER-A/TeleportOracleAuth.json';
import goerliETHGOERATeleportJoinAbi from '../../../eth-sdk/abis/goerli/ETH-GOER-A/TeleportJoin.json';
import goerliETHGOERAVatAbi from '../../../eth-sdk/abis/goerli/ETH-GOER-A/Vat.json';
import goerliETHGOERAMulticallAbi from '../../../eth-sdk/abis/goerli/ETH-GOER-A/Multicall.json';
import goerliETHGOERAFakeOutboxAbi from '../../../eth-sdk/abis/goerli/ETH-GOER-A/FakeOutbox.json';
import goerliETHGOERABasicRelayAbi from '../../../eth-sdk/abis/goerli/ETH-GOER-A/BasicRelay.json';
import goerliETHGOERATrustedRelayAbi from '../../../eth-sdk/abis/goerli/ETH-GOER-A/TrustedRelay.json';
import goerliETHGOERADaiAbi from '../../../eth-sdk/abis/goerli/ETH-GOER-A/Dai.json';
import optimismGoerliTestnetOPTGOERATeleportOutboundGatewayAbi from '../../../eth-sdk/abis/optimismGoerliTestnet/OPT-GOER-A/TeleportOutboundGateway.json';
import optimismGoerliTestnetOPTGOERAFaucetAbi from '../../../eth-sdk/abis/optimismGoerliTestnet/OPT-GOER-A/Faucet.json';
import optimismGoerliTestnetOPTGOERADaiAbi from '../../../eth-sdk/abis/optimismGoerliTestnet/OPT-GOER-A/Dai.json';
import arbitrumGoerliTestnetARBGOERATeleportOutboundGatewayAbi from '../../../eth-sdk/abis/arbitrumGoerliTestnet/ARB-GOER-A/TeleportOutboundGateway.json';
import arbitrumGoerliTestnetARBGOERAFaucetAbi from '../../../eth-sdk/abis/arbitrumGoerliTestnet/ARB-GOER-A/Faucet.json';
import arbitrumGoerliTestnetARBGOERADaiAbi from '../../../eth-sdk/abis/arbitrumGoerliTestnet/ARB-GOER-A/Dai.json';
import mainnetETHMAINATeleportOracleAuthAbi from '../../../eth-sdk/abis/mainnet/ETH-MAIN-A/TeleportOracleAuth.json';
import mainnetETHMAINATeleportJoinAbi from '../../../eth-sdk/abis/mainnet/ETH-MAIN-A/TeleportJoin.json';
import mainnetETHMAINAVatAbi from '../../../eth-sdk/abis/mainnet/ETH-MAIN-A/Vat.json';
import mainnetETHMAINAMulticallAbi from '../../../eth-sdk/abis/mainnet/ETH-MAIN-A/Multicall.json';
import mainnetETHMAINABasicRelayAbi from '../../../eth-sdk/abis/mainnet/ETH-MAIN-A/BasicRelay.json';
import mainnetETHMAINATrustedRelayAbi from '../../../eth-sdk/abis/mainnet/ETH-MAIN-A/TrustedRelay.json';
import mainnetETHMAINADaiAbi from '../../../eth-sdk/abis/mainnet/ETH-MAIN-A/Dai.json';
import optimismOPTMAINATeleportOutboundGatewayAbi from '../../../eth-sdk/abis/optimism/OPT-MAIN-A/TeleportOutboundGateway.json';
import optimismOPTMAINADaiAbi from '../../../eth-sdk/abis/optimism/OPT-MAIN-A/Dai.json';
import arbitrumOneARBONEATeleportOutboundGatewayAbi from '../../../eth-sdk/abis/arbitrumOne/ARB-ONE-A/TeleportOutboundGateway.json';
import arbitrumOneARBONEADaiAbi from '../../../eth-sdk/abis/arbitrumOne/ARB-ONE-A/Dai.json';
export function getContract(address, abi, defaultSigner) {
    return new Contract(address, abi, defaultSigner);
}
export function getKovanSdk(defaultSigner) {
    return {
        "KOVAN-MASTER-1": {
            "TeleportOracleAuth": getContract('0x0b0D629e294Af96A6cc245a89A5CEa92C8Be9da4', kovanKOVANMASTER1TeleportOracleAuthAbi, defaultSigner),
            "TeleportJoin": getContract('0x556D9076A42Bba1892E3F4cA331daE587185Cef9', kovanKOVANMASTER1TeleportJoinAbi, defaultSigner),
            "Vat": getContract('0xbA987bDB501d131f766fEe8180Da5d81b34b69d9', kovanKOVANMASTER1VatAbi, defaultSigner),
            "Multicall": getContract('0xC6D81A2e375Eee15a20E6464b51c5FC6Bb949fdA', kovanKOVANMASTER1MulticallAbi, defaultSigner),
            "BasicRelay": getContract('0x5B3363996Bd8164F07315faAf3F96B72D192382c', kovanKOVANMASTER1BasicRelayAbi, defaultSigner),
            "TrustedRelay": getContract('0xAAFa36901AdC6C03df8B935fFA129677D1D7Eb81', kovanKOVANMASTER1TrustedRelayAbi, defaultSigner),
            "Dai": getContract('0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa', kovanKOVANMASTER1DaiAbi, defaultSigner),
        },
    };
}
export function getOptimismKovanSdk(defaultSigner) {
    return {
        "KOVAN-SLAVE-OPTIMISM-1": {
            "TeleportOutboundGateway": getContract('0x0aeDbEf4105fdfc0db5A3Cd8C827bE2efA93ebe0', optimismKovanKOVANSLAVEOPTIMISM1TeleportOutboundGatewayAbi, defaultSigner),
            "Faucet": getContract('0xDB66c86899967A3D9E4D77D7d2Bb703747aAEeA7', optimismKovanKOVANSLAVEOPTIMISM1FaucetAbi, defaultSigner),
            "Dai": getContract('0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', optimismKovanKOVANSLAVEOPTIMISM1DaiAbi, defaultSigner),
        },
    };
}
export function getRinkebySdk(defaultSigner) {
    return {
        "RINKEBY-MASTER-1": {
            "TeleportOracleAuth": getContract('0x1E7722E502D3dCbB0704f99c75c99a5402598f13', rinkebyRINKEBYMASTER1TeleportOracleAuthAbi, defaultSigner),
            "TeleportJoin": getContract('0x894DB23D804c626f1aAA89a2Bc3280052e6c4750', rinkebyRINKEBYMASTER1TeleportJoinAbi, defaultSigner),
            "Vat": getContract('0x66b3D63621FDD5967603A824114Da95cc3A35107', rinkebyRINKEBYMASTER1VatAbi, defaultSigner),
            "Multicall": getContract('0x86d3b107386756208154a5c9100a0d4557280747', rinkebyRINKEBYMASTER1MulticallAbi, defaultSigner),
            "FakeOutbox": getContract('0x4A2D3d40c14c10Df50a15A3f1359Fb0F5C893899', rinkebyRINKEBYMASTER1FakeOutboxAbi, defaultSigner),
            "BasicRelay": getContract('0xC35787975484A858B878032B045B6E0B6EfE2e2c', rinkebyRINKEBYMASTER1BasicRelayAbi, defaultSigner),
            "TrustedRelay": getContract('0xef4dF54E711e0d42754a12e85fD4186f8fF2c7A7', rinkebyRINKEBYMASTER1TrustedRelayAbi, defaultSigner),
            "Dai": getContract('0x17B729a6Ac1f265090cbb4AecBdd53E34664C00e', rinkebyRINKEBYMASTER1DaiAbi, defaultSigner),
        },
    };
}
export function getArbitrumTestnetSdk(defaultSigner) {
    return {
        "RINKEBY-SLAVE-ARBITRUM-1": {
            "TeleportOutboundGateway": getContract('0x327c2f7aCd799f31535880Af54C2bCAB1384Ecc3', arbitrumTestnetRINKEBYSLAVEARBITRUM1TeleportOutboundGatewayAbi, defaultSigner),
            "Faucet": getContract('0xc72cfA99ef0aec40334A2df3E70eB1028402cceE', arbitrumTestnetRINKEBYSLAVEARBITRUM1FaucetAbi, defaultSigner),
            "Dai": getContract('0x78e59654Bc33dBbFf9FfF83703743566B1a0eA15', arbitrumTestnetRINKEBYSLAVEARBITRUM1DaiAbi, defaultSigner),
        },
    };
}
export function getGoerliSdk(defaultSigner) {
    return {
        "ETH-GOER-A": {
            "TeleportOracleAuth": getContract('0xe6c2b941d268cA7690c01F95Cd4bDD12360A0A4F', goerliETHGOERATeleportOracleAuthAbi, defaultSigner),
            "TeleportJoin": getContract('0xd88310A476ee960487FDb2772CC4bd017dadEf6B', goerliETHGOERATeleportJoinAbi, defaultSigner),
            "Vat": getContract('0x293D5AA7F26EF9A687880C4501871632d1015A82', goerliETHGOERAVatAbi, defaultSigner),
            "Multicall": getContract('0xb8c864B60e9467398800Df34da39BF4f0c459461', goerliETHGOERAMulticallAbi, defaultSigner),
            "FakeOutbox": getContract('0x95637Cabe684a324A8225C4b6Ce880D70074938d', goerliETHGOERAFakeOutboxAbi, defaultSigner),
            "BasicRelay": getContract('0x0Cb8747982d99f4b8640EE27330ADD0c2b54d0e6', goerliETHGOERABasicRelayAbi, defaultSigner),
            "TrustedRelay": getContract('0xB23Ab27F7B59B718ea1eEF536F66e1Db3F18ac8E', goerliETHGOERATrustedRelayAbi, defaultSigner),
            "Dai": getContract('0x0089Ed33ED517F58a064D0ef56C9E89Dc01EE9A2', goerliETHGOERADaiAbi, defaultSigner),
        },
    };
}
export function getOptimismGoerliTestnetSdk(defaultSigner) {
    return {
        "OPT-GOER-A": {
            "TeleportOutboundGateway": getContract('0xFF660111D2C6887D8F24B5378cceDbf465B33B6F', optimismGoerliTestnetOPTGOERATeleportOutboundGatewayAbi, defaultSigner),
            "Faucet": getContract('0xD9e08dc985012296b9A80BEf4a587Ad72288D986', optimismGoerliTestnetOPTGOERAFaucetAbi, defaultSigner),
            "Dai": getContract('0x8ea903081aa1137F11D51F64A1F372EDe67571a9', optimismGoerliTestnetOPTGOERADaiAbi, defaultSigner),
        },
    };
}
export function getArbitrumGoerliTestnetSdk(defaultSigner) {
    return {
        "ARB-GOER-A": {
            "TeleportOutboundGateway": getContract('0xb586c1D27Ee93329B1da48B8F7F4436C173FCef8', arbitrumGoerliTestnetARBGOERATeleportOutboundGatewayAbi, defaultSigner),
            "Faucet": getContract('0x9031Ab810C496FCF09B65851c736E9a37983B963', arbitrumGoerliTestnetARBGOERAFaucetAbi, defaultSigner),
            "Dai": getContract('0x8ea903081aa1137F11D51F64A1F372EDe67571a9', arbitrumGoerliTestnetARBGOERADaiAbi, defaultSigner),
        },
    };
}
export function getMainnetSdk(defaultSigner) {
    return {
        "ETH-MAIN-A": {
            "TeleportOracleAuth": getContract('0x324a895625E7AE38Fc7A6ae91a71e7E937Caa7e6', mainnetETHMAINATeleportOracleAuthAbi, defaultSigner),
            "TeleportJoin": getContract('0x41Ca7a7Aa2Be78Cf7CB80C0F4a9bdfBC96e81815', mainnetETHMAINATeleportJoinAbi, defaultSigner),
            "Vat": getContract('0x35D1b3F3D7966A1DFe207aa4514C12a259A0492B', mainnetETHMAINAVatAbi, defaultSigner),
            "Multicall": getContract('0x5e227AD1969Ea493B43F840cfF78d08a6fc17796', mainnetETHMAINAMulticallAbi, defaultSigner),
            "BasicRelay": getContract('0x0b627300c5f06C5510243081fc66868A0F440d62', mainnetETHMAINABasicRelayAbi, defaultSigner),
            "TrustedRelay": getContract('0xFabFEd371884ddBd4704867484EB0B419C7fC967', mainnetETHMAINATrustedRelayAbi, defaultSigner),
            "Dai": getContract('0x6B175474E89094C44Da98b954EedeAC495271d0F', mainnetETHMAINADaiAbi, defaultSigner),
        },
    };
}
export function getOptimismSdk(defaultSigner) {
    return {
        "OPT-MAIN-A": {
            "TeleportOutboundGateway": getContract('0x18d2CF2296c5b29343755E6B7e37679818913f88', optimismOPTMAINATeleportOutboundGatewayAbi, defaultSigner),
            "Dai": getContract('0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', optimismOPTMAINADaiAbi, defaultSigner),
        },
    };
}
export function getArbitrumOneSdk(defaultSigner) {
    return {
        "ARB-ONE-A": {
            "TeleportOutboundGateway": getContract('0x5dBaf6F2bEDebd414F8d78d13499222347e59D5E', arbitrumOneARBONEATeleportOutboundGatewayAbi, defaultSigner),
            "Dai": getContract('0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', arbitrumOneARBONEADaiAbi, defaultSigner),
        },
    };
}
