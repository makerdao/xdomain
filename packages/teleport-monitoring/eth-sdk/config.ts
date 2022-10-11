import { defineConfig } from '@dethcrypto/eth-sdk'
import { join } from 'path'

export default defineConfig({
  contracts: {
    goerli: {
      dai: '0x11fE4B6AE13d2a6055C8D9cF65c55bac32B5d844',
      join: '0xE2fddf4e0f5A4B6d0Cc1D162FBFbEF7B6c5D6f69',
      oracleAuth: '0x29d292E0773E484dbcA8626F432985630175763b',
      escrows: {
        'OPT-GOER-A': '0xbc892A208705862273008B2Fb7D01E968be42653',
        'ARB-GOER-A': '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
      },
    },
    optimismGoerliTestnet: {
      dai: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
      teleportGateway: '0xd9e000C419F3aA4EA1C519497f5aF249b496a00f',
    },
    arbitrumGoerliTestnet: {
      dai: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
      teleportGateway: '0x8334a747731Be3a58bCcAf9a3D35EbC968806223',
    },
    mainnet: {
      dai: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      join: '0x41Ca7a7Aa2Be78Cf7CB80C0F4a9bdfBC96e81815',
      oracleAuth: '0x324a895625E7AE38Fc7A6ae91a71e7E937Caa7e6',
      escrows: {
        'OPT-MAIN-A': '0x467194771dAe2967Aef3ECbEDD3Bf9a310C76C65',
        'ARB-ONE-A': '0xA10c7CE4b876998858b1a9E12b10092229539400',
      },
    },
    optimism: {
      dai: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
      teleportGateway: '0x18d2CF2296c5b29343755E6B7e37679818913f88',
    },
    arbitrumOne: {
      dai: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
      teleportGateway: '0x5dBaf6F2bEDebd414F8d78d13499222347e59D5E',
    },
  },
  outputPath: join(__dirname, '../src/sdk'),
})
