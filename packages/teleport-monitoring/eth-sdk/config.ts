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
    rinkeby: {
      dai: '0xd9e66A2f546880EA4d800F189d6F12Cc15Bff281',
      escrow: '0x467194771dAe2967Aef3ECbEDD3Bf9a310C76C65',
      join: '0x894DB23D804c626f1aAA89a2Bc3280052e6c4750',
      oracleAuth: '0x1E7722E502D3dCbB0704f99c75c99a5402598f13',
    },
    arbitrumTestnet: {
      dai: '0x78e59654Bc33dBbFf9FfF83703743566B1a0eA15',
      teleportGateway: '0x327c2f7aCd799f31535880Af54C2bCAB1384Ecc3',
    },
  },
  outputPath: join(__dirname, '../src/sdk'),
})
