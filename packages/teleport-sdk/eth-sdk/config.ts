import { defineConfig } from '@dethcrypto/eth-sdk'

export default defineConfig({
  contracts: {
    kovan: {
      'KOVAN-MASTER-1': {
        TeleportOracleAuth: '0x0b0D629e294Af96A6cc245a89A5CEa92C8Be9da4',
        TeleportJoin: '0x556D9076A42Bba1892E3F4cA331daE587185Cef9',
        Vat: '0xbA987bDB501d131f766fEe8180Da5d81b34b69d9',
        Multicall: '0xC6D81A2e375Eee15a20E6464b51c5FC6Bb949fdA',
        BasicRelay: '0x5B3363996Bd8164F07315faAf3F96B72D192382c',
        TrustedRelay: '0xAAFa36901AdC6C03df8B935fFA129677D1D7Eb81',
        Dai: '0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa', // L1Dai
      },
    },
    optimismKovan: {
      'KOVAN-SLAVE-OPTIMISM-1': {
        TeleportOutboundGateway: '0x0aeDbEf4105fdfc0db5A3Cd8C827bE2efA93ebe0', // L2DaiTeleportGateway
        Faucet: '0xDB66c86899967A3D9E4D77D7d2Bb703747aAEeA7', // L2Dai Faucet
        Dai: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', // L2Dai
      },
    },
    rinkeby: {
      'RINKEBY-MASTER-1': {
        TeleportOracleAuth: '0x1E7722E502D3dCbB0704f99c75c99a5402598f13',
        TeleportJoin: '0x894DB23D804c626f1aAA89a2Bc3280052e6c4750',
        Vat: '0x66b3D63621FDD5967603A824114Da95cc3A35107',
        Multicall: '0x86d3b107386756208154a5c9100a0d4557280747',
        FakeOutbox: '0x4A2D3d40c14c10Df50a15A3f1359Fb0F5C893899',
        Outbox: '0x2360A33905dc1c72b12d975d975F42BaBdcef9F3',
        BasicRelay: '0xC35787975484A858B878032B045B6E0B6EfE2e2c',
        TrustedRelay: '0xef4dF54E711e0d42754a12e85fD4186f8fF2c7A7',
        Dai: '0x17B729a6Ac1f265090cbb4AecBdd53E34664C00e', // L1Dai
      },
    },
    arbitrumTestnet: {
      'RINKEBY-SLAVE-ARBITRUM-1': {
        TeleportOutboundGateway: '0x327c2f7aCd799f31535880Af54C2bCAB1384Ecc3', // L2DaiTeleportGateway
        Faucet: '0xc72cfA99ef0aec40334A2df3E70eB1028402cceE', // L2Dai Faucet
        Dai: '0x78e59654Bc33dBbFf9FfF83703743566B1a0eA15', // L2Dai
      },
    },
    goerli: {
      'ETH-GOER-A': {
        TeleportOracleAuth: '0xe6c2b941d268cA7690c01F95Cd4bDD12360A0A4F',
        TeleportJoin: '0xd88310A476ee960487FDb2772CC4bd017dadEf6B',
        Vat: '0x293D5AA7F26EF9A687880C4501871632d1015A82',
        Multicall: '0xb8c864B60e9467398800Df34da39BF4f0c459461',
        FakeOutbox: '0x95637Cabe684a324A8225C4b6Ce880D70074938d',
        Outbox: '0x45Af9Ed1D03703e480CE7d328fB684bb67DA5049',
        BasicRelay: '0x0Cb8747982d99f4b8640EE27330ADD0c2b54d0e6',
        TrustedRelay: '0xB23Ab27F7B59B718ea1eEF536F66e1Db3F18ac8E',
        Dai: '0x0089Ed33ED517F58a064D0ef56C9E89Dc01EE9A2', // L1Dai
      },
    },
    optimismGoerliTestnet: {
      'OPT-GOER-A': {
        TeleportOutboundGateway: '0xFF660111D2C6887D8F24B5378cceDbf465B33B6F', // L2DaiTeleportGateway
        Faucet: '0xD9e08dc985012296b9A80BEf4a587Ad72288D986', // L2Dai Faucet
        Dai: '0x8ea903081aa1137F11D51F64A1F372EDe67571a9', // L2Dai
      },
    },
    arbitrumGoerliTestnet: {
      'ARB-GOER-A': {
        TeleportOutboundGateway: '0xb586c1D27Ee93329B1da48B8F7F4436C173FCef8', // L2DaiTeleportGateway
        Faucet: '0xc72cfA99ef0aec40334A2df3E70eB1028402cceE', // L2Dai Faucet
        Dai: '0x8ea903081aa1137F11D51F64A1F372EDe67571a9', // L2Dai
      },
    },
  },
  outputPath: './src/sdk',
})
