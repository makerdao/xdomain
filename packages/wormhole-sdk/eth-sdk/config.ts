import { defineConfig } from '@dethcrypto/eth-sdk'

export default defineConfig({
  contracts: {
    kovan: {
      'KOVAN-MASTER-1': {
        WormholeOracleAuth: '0x0b0D629e294Af96A6cc245a89A5CEa92C8Be9da4',
        WormholeJoin: '0x556D9076A42Bba1892E3F4cA331daE587185Cef9',
        Vat: '0xbA987bDB501d131f766fEe8180Da5d81b34b69d9',
        Multicall: '0xC6D81A2e375Eee15a20E6464b51c5FC6Bb949fdA',
        Relay: '0x5B3363996Bd8164F07315faAf3F96B72D192382c',
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
        WormholeOracleAuth: '0x7FD07147305f7eCcA62d0a7737bbE0Bd8AC5359b',
        WormholeJoin: '0x2Cd1b8fe049a5a52Bd48e9c7aA651b2C013545A6',
        Vat: '0x66b3D63621FDD5967603A824114Da95cc3A35107',
        Multicall: '0x86d3b107386756208154a5c9100a0d4557280747',
        FakeOutbox: '0x1a8fe93d3c07cc860fee5c1fe4dacbe1fade62f9',
        Outbox: '0x2360A33905dc1c72b12d975d975F42BaBdcef9F3',
        Relay: '0x1908fcC97a16F9ED9C70d26c023A4fAd040e95A9',
      },
    },
    arbitrumTestnet: {
      'RINKEBY-SLAVE-ARBITRUM-1': {
        WormholeOutboundGateway: '0xEbA80E9d7C6C2F575a642a43199e32F47Bbd1306', // L2DaiWormholeGateway
        Faucet: '0xc72cfA99ef0aec40334A2df3E70eB1028402cceE', // L2Dai Faucet
      },
    },
  },
  outputPath: './src/sdk',
})
