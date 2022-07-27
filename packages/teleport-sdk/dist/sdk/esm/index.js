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
import rinkebyRINKEBYMASTER1OutboxAbi from '../../../eth-sdk/abis/rinkeby/RINKEBY-MASTER-1/Outbox.json';
import rinkebyRINKEBYMASTER1BasicRelayAbi from '../../../eth-sdk/abis/rinkeby/RINKEBY-MASTER-1/BasicRelay.json';
import rinkebyRINKEBYMASTER1TrustedRelayAbi from '../../../eth-sdk/abis/rinkeby/RINKEBY-MASTER-1/TrustedRelay.json';
import rinkebyRINKEBYMASTER1DaiAbi from '../../../eth-sdk/abis/rinkeby/RINKEBY-MASTER-1/Dai.json';
import arbitrumTestnetRINKEBYSLAVEARBITRUM1TeleportOutboundGatewayAbi from '../../../eth-sdk/abis/arbitrumTestnet/RINKEBY-SLAVE-ARBITRUM-1/TeleportOutboundGateway.json';
import arbitrumTestnetRINKEBYSLAVEARBITRUM1FaucetAbi from '../../../eth-sdk/abis/arbitrumTestnet/RINKEBY-SLAVE-ARBITRUM-1/Faucet.json';
import arbitrumTestnetRINKEBYSLAVEARBITRUM1DaiAbi from '../../../eth-sdk/abis/arbitrumTestnet/RINKEBY-SLAVE-ARBITRUM-1/Dai.json';
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
            "Outbox": getContract('0x2360A33905dc1c72b12d975d975F42BaBdcef9F3', rinkebyRINKEBYMASTER1OutboxAbi, defaultSigner),
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
