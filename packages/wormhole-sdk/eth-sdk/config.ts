import { defineConfig } from '@dethcrypto/eth-sdk'

export default defineConfig({
  contracts: {
    kovan: {
      'KOVAN-MASTER-1': {
        WormholeOracleAuth: '0x0b0D629e294Af96A6cc245a89A5CEa92C8Be9da4',
        WormholeJoin: '0x556D9076A42Bba1892E3F4cA331daE587185Cef9',
        Vat: '0xbA987bDB501d131f766fEe8180Da5d81b34b69d9',
        Multicall: '0xC6D81A2e375Eee15a20E6464b51c5FC6Bb949fdA',
        BasicRelay: '0x5B3363996Bd8164F07315faAf3F96B72D192382c',
        TrustedRelay: '0xAAFa36901AdC6C03df8B935fFA129677D1D7Eb81',
      },
    },
    optimismKovan: {
      'KOVAN-SLAVE-OPTIMISM-1': {
        WormholeOutboundGateway: '0x0aeDbEf4105fdfc0db5A3Cd8C827bE2efA93ebe0', // L2DaiWormholeGateway
        Faucet: '0xDB66c86899967A3D9E4D77D7d2Bb703747aAEeA7', // L2Dai Faucet
      },
    },
    rinkeby: {
      'RINKEBY-MASTER-1': {
        WormholeOracleAuth: '0x1E7722E502D3dCbB0704f99c75c99a5402598f13',
        WormholeJoin: '0x894DB23D804c626f1aAA89a2Bc3280052e6c4750',
        Vat: '0x66b3D63621FDD5967603A824114Da95cc3A35107',
        Multicall: '0x86d3b107386756208154a5c9100a0d4557280747',
        FakeOutbox: '0x4A2D3d40c14c10Df50a15A3f1359Fb0F5C893899',
        Outbox: '0x2360A33905dc1c72b12d975d975F42BaBdcef9F3',
        BasicRelay: '0xC35787975484A858B878032B045B6E0B6EfE2e2c',
        TrustedRelay: '0xef4dF54E711e0d42754a12e85fD4186f8fF2c7A7',
      },
    },
    arbitrumTestnet: {
      'RINKEBY-SLAVE-ARBITRUM-1': {
        WormholeOutboundGateway: '0x327c2f7aCd799f31535880Af54C2bCAB1384Ecc3', // L2DaiWormholeGateway
        Faucet: '0xc72cfA99ef0aec40334A2df3E70eB1028402cceE', // L2Dai Faucet
      },
    },
  },
  outputPath: './src/sdk',
})
