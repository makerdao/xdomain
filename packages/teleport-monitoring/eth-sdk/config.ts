import { defineConfig } from '@dethcrypto/eth-sdk'
import { join } from 'path'

export default defineConfig({
  contracts: {
    kovan: {
      dai: '0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa',
      escrow: '0x8FdA2c4323850F974C7Abf4B16eD129D45f9E2e2',
      join: '0x556D9076A42Bba1892E3F4cA331daE587185Cef9',
      oracleAuth: '0x0b0D629e294Af96A6cc245a89A5CEa92C8Be9da4',
    },
    optimismKovan: {
      dai: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
      teleportGateway: '0x0aeDbEf4105fdfc0db5A3Cd8C827bE2efA93ebe0',
    },
  },
  outputPath: join(__dirname, '../src/sdk'),
})
