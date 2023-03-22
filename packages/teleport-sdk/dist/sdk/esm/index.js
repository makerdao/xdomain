import { Contract } from 'ethers';
import mainnetETHMAINATeleportOracleAuthAbi from '../../eth-sdk/abis/mainnet/ETH-MAIN-A/TeleportOracleAuth.json';
import mainnetETHMAINATeleportJoinAbi from '../../eth-sdk/abis/mainnet/ETH-MAIN-A/TeleportJoin.json';
import mainnetETHMAINAVatAbi from '../../eth-sdk/abis/mainnet/ETH-MAIN-A/Vat.json';
import mainnetETHMAINAMulticallAbi from '../../eth-sdk/abis/mainnet/ETH-MAIN-A/Multicall.json';
import mainnetETHMAINABasicRelayAbi from '../../eth-sdk/abis/mainnet/ETH-MAIN-A/BasicRelay.json';
import mainnetETHMAINATrustedRelayAbi from '../../eth-sdk/abis/mainnet/ETH-MAIN-A/TrustedRelay.json';
import mainnetETHMAINADaiAbi from '../../eth-sdk/abis/mainnet/ETH-MAIN-A/Dai.json';
import optimismOPTMAINATeleportOutboundGatewayAbi from '../../eth-sdk/abis/optimism/OPT-MAIN-A/TeleportOutboundGateway.json';
import optimismOPTMAINADaiAbi from '../../eth-sdk/abis/optimism/OPT-MAIN-A/Dai.json';
import arbitrumOneARBONEATeleportOutboundGatewayAbi from '../../eth-sdk/abis/arbitrumOne/ARB-ONE-A/TeleportOutboundGateway.json';
import arbitrumOneARBONEADaiAbi from '../../eth-sdk/abis/arbitrumOne/ARB-ONE-A/Dai.json';
import goerliETHGOERATeleportOracleAuthAbi from '../../eth-sdk/abis/goerli/ETH-GOER-A/TeleportOracleAuth.json';
import goerliETHGOERATeleportJoinAbi from '../../eth-sdk/abis/goerli/ETH-GOER-A/TeleportJoin.json';
import goerliETHGOERAVatAbi from '../../eth-sdk/abis/goerli/ETH-GOER-A/Vat.json';
import goerliETHGOERAMulticallAbi from '../../eth-sdk/abis/goerli/ETH-GOER-A/Multicall.json';
import goerliETHGOERABasicRelayAbi from '../../eth-sdk/abis/goerli/ETH-GOER-A/BasicRelay.json';
import goerliETHGOERATrustedRelayAbi from '../../eth-sdk/abis/goerli/ETH-GOER-A/TrustedRelay.json';
import goerliETHGOERADaiAbi from '../../eth-sdk/abis/goerli/ETH-GOER-A/Dai.json';
import optimismGoerliTestnetOPTGOERATeleportOutboundGatewayAbi from '../../eth-sdk/abis/optimismGoerliTestnet/OPT-GOER-A/TeleportOutboundGateway.json';
import optimismGoerliTestnetOPTGOERAFaucetAbi from '../../eth-sdk/abis/optimismGoerliTestnet/OPT-GOER-A/Faucet.json';
import optimismGoerliTestnetOPTGOERADaiAbi from '../../eth-sdk/abis/optimismGoerliTestnet/OPT-GOER-A/Dai.json';
import arbitrumGoerliTestnetARBGOERATeleportOutboundGatewayAbi from '../../eth-sdk/abis/arbitrumGoerliTestnet/ARB-GOER-A/TeleportOutboundGateway.json';
import arbitrumGoerliTestnetARBGOERAFaucetAbi from '../../eth-sdk/abis/arbitrumGoerliTestnet/ARB-GOER-A/Faucet.json';
import arbitrumGoerliTestnetARBGOERADaiAbi from '../../eth-sdk/abis/arbitrumGoerliTestnet/ARB-GOER-A/Dai.json';
export function getContract(address, abi, defaultSigner) {
    return new Contract(address, abi, defaultSigner);
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
export function getGoerliSdk(defaultSigner) {
    return {
        "ETH-GOER-A": {
            "TeleportOracleAuth": getContract('0x29d292E0773E484dbcA8626F432985630175763b', goerliETHGOERATeleportOracleAuthAbi, defaultSigner),
            "TeleportJoin": getContract('0xE2fddf4e0f5A4B6d0Cc1D162FBFbEF7B6c5D6f69', goerliETHGOERATeleportJoinAbi, defaultSigner),
            "Vat": getContract('0xB966002DDAa2Baf48369f5015329750019736031', goerliETHGOERAVatAbi, defaultSigner),
            "Multicall": getContract('0xb8c864B60e9467398800Df34da39BF4f0c459461', goerliETHGOERAMulticallAbi, defaultSigner),
            "BasicRelay": getContract('0x238a2523B3F211c4099517579B951347c5E5BF55', goerliETHGOERABasicRelayAbi, defaultSigner),
            "TrustedRelay": getContract('0x54Aa25B69a3D73A15D21A01a9943E63BAa4c1c58', goerliETHGOERATrustedRelayAbi, defaultSigner),
            "Dai": getContract('0x11fE4B6AE13d2a6055C8D9cF65c55bac32B5d844', goerliETHGOERADaiAbi, defaultSigner),
        },
    };
}
export function getOptimismGoerliTestnetSdk(defaultSigner) {
    return {
        "OPT-GOER-A": {
            "TeleportOutboundGateway": getContract('0xd9e000C419F3aA4EA1C519497f5aF249b496a00f', optimismGoerliTestnetOPTGOERATeleportOutboundGatewayAbi, defaultSigner),
            "Faucet": getContract('0xD9e08dc985012296b9A80BEf4a587Ad72288D986', optimismGoerliTestnetOPTGOERAFaucetAbi, defaultSigner),
            "Dai": getContract('0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', optimismGoerliTestnetOPTGOERADaiAbi, defaultSigner),
        },
    };
}
export function getArbitrumGoerliTestnetSdk(defaultSigner) {
    return {
        "ARB-GOER-A": {
            "TeleportOutboundGateway": getContract('0x8334a747731Be3a58bCcAf9a3D35EbC968806223', arbitrumGoerliTestnetARBGOERATeleportOutboundGatewayAbi, defaultSigner),
            "Faucet": getContract('0x9031Ab810C496FCF09B65851c736E9a37983B963', arbitrumGoerliTestnetARBGOERAFaucetAbi, defaultSigner),
            "Dai": getContract('0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', arbitrumGoerliTestnetARBGOERADaiAbi, defaultSigner),
        },
    };
}
