import { defineConfig } from '@dethcrypto/eth-sdk'

const USE_TEST_GOERLI = false // use "test goerli" env? If false => use "staging goerli" env

const testGoerli: any = {
  goerli: {
    'ETH-GOER-A': {
      TeleportOracleAuth: '0xe6c2b941d268cA7690c01F95Cd4bDD12360A0A4F',
      TeleportJoin: '0xd88310A476ee960487FDb2772CC4bd017dadEf6B',
      Vat: '0x293D5AA7F26EF9A687880C4501871632d1015A82',
      Multicall: '0xb8c864B60e9467398800Df34da39BF4f0c459461',
      FakeOutbox: '0x95637Cabe684a324A8225C4b6Ce880D70074938d',
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
      Faucet: '0x9031Ab810C496FCF09B65851c736E9a37983B963', // L2Dai Faucet
      Dai: '0x8ea903081aa1137F11D51F64A1F372EDe67571a9', // L2Dai
    },
  },
}

const stagingGoerli: any = {
  goerli: {
    'ETH-GOER-A': {
      TeleportOracleAuth: '0x29d292E0773E484dbcA8626F432985630175763b',
      TeleportJoin: '0xE2fddf4e0f5A4B6d0Cc1D162FBFbEF7B6c5D6f69',
      Vat: '0xB966002DDAa2Baf48369f5015329750019736031',
      Multicall: '0xb8c864B60e9467398800Df34da39BF4f0c459461',
      BasicRelay: '0x238a2523B3F211c4099517579B951347c5E5BF55',
      TrustedRelay: '0x54Aa25B69a3D73A15D21A01a9943E63BAa4c1c58',
      Dai: '0x11fE4B6AE13d2a6055C8D9cF65c55bac32B5d844', // L1Dai
    },
  },
  optimismGoerliTestnet: {
    'OPT-GOER-A': {
      TeleportOutboundGateway: '0xd9e000C419F3aA4EA1C519497f5aF249b496a00f', // L2DaiTeleportGateway
      Faucet: '0xD9e08dc985012296b9A80BEf4a587Ad72288D986', // L2Dai Faucet
      Dai: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', // L2Dai
    },
  },
  arbitrumGoerliTestnet: {
    'ARB-GOER-A': {
      TeleportOutboundGateway: '0x8334a747731Be3a58bCcAf9a3D35EbC968806223', // L2DaiTeleportGateway
      Faucet: '0x9031Ab810C496FCF09B65851c736E9a37983B963', // L2Dai Faucet
      Dai: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', // L2Dai
    },
  },
}

export default defineConfig({
  contracts: {
    mainnet: {
      'ETH-MAIN-A': {
        TeleportOracleAuth: '0x324a895625E7AE38Fc7A6ae91a71e7E937Caa7e6',
        TeleportJoin: '0x41Ca7a7Aa2Be78Cf7CB80C0F4a9bdfBC96e81815',
        Vat: '0x35D1b3F3D7966A1DFe207aa4514C12a259A0492B',
        Multicall: '0x5e227AD1969Ea493B43F840cfF78d08a6fc17796',
        BasicRelay: '0x0b627300c5f06C5510243081fc66868A0F440d62',
        TrustedRelay: '0xFabFEd371884ddBd4704867484EB0B419C7fC967',
        Dai: '0x6B175474E89094C44Da98b954EedeAC495271d0F', // L1Dai
      },
    },
    optimism: {
      'OPT-MAIN-A': {
        TeleportOutboundGateway: '0x18d2CF2296c5b29343755E6B7e37679818913f88', // L2DaiTeleportGateway
        Dai: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', // L2Dai
      },
    },
    arbitrumOne: {
      'ARB-ONE-A': {
        TeleportOutboundGateway: '0x5dBaf6F2bEDebd414F8d78d13499222347e59D5E', // L2DaiTeleportGateway
        Dai: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', // L2Dai
      },
    },
    ...(USE_TEST_GOERLI ? testGoerli : stagingGoerli),
  },
  outputPath: './src/sdk',
})
