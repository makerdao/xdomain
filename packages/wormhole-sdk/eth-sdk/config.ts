import { defineConfig } from '@dethcrypto/eth-sdk'

export default defineConfig({
  contracts: {
    kovan: {
      'KOVAN-MASTER-1': {
        WormholeOracleAuth: '0xcEBe310e86d44a55EC6Be05e0c233B033979BC67',
        WormholeJoin: '0x5B321180cC155a6fd38bc14a64205d1344317975',
        Vat: '0xbA987bDB501d131f766fEe8180Da5d81b34b69d9',
        Multicall: '0xC6D81A2e375Eee15a20E6464b51c5FC6Bb949fdA',
      },
    },
    optimismKovan: {
      'KOVAN-SLAVE-OPTIMISM-1': {
        WormholeOutboundGateway: '0x45440Ae4988965A4cD94651E715fC9A04e62Fb41', // L2DAIWormholeBridge
        Faucet: '0xDB66c86899967A3D9E4D77D7d2Bb703747aAEeA7', // L2Dai Faucet
      },
    },
    rinkeby: {
      'RINKEBY-MASTER-1': {
        WormholeOracleAuth: '0x7FD07147305f7eCcA62d0a7737bbE0Bd8AC5359b',
        WormholeJoin: '0x2Cd1b8fe049a5a52Bd48e9c7aA651b2C013545A6',
        Vat: '0x66b3D63621FDD5967603A824114Da95cc3A35107',
        Multicall: '0x86d3b107386756208154a5c9100a0d4557280747',
        FakeOutbox: '0x1a8fe93d3c07cc860fee5c1fe4dacbe1fade62f9',
        Outbox: '0x2360A33905dc1c72b12d975d975F42BaBdcef9F3',
      },
    },
    arbitrumTestnet: {
      'RINKEBY-SLAVE-ARBITRUM-1': {
        WormholeOutboundGateway: '0xEbA80E9d7C6C2F575a642a43199e32F47Bbd1306', // L2DaiWormholeGateway
        Faucet: '0xc72cfA99ef0aec40334A2df3E70eB1028402cceE', // L2Dai Faucet
      },
    },
  },
})
