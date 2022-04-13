import { defineConfig } from '@dethcrypto/eth-sdk'

export default defineConfig({
  contracts: {
    optimismKovan: {
      WormholeOutboundGateway: '0x0aeDbEf4105fdfc0db5A3Cd8C827bE2efA93ebe0', // L2DaiWormholeGateway
    },
  },
  outputPath: './src/sdk',
})
