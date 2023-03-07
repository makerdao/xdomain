import { invert } from 'lodash'

import { NetworkConfig } from './types'

export const chainIds = {
  GOERLI: 5,
  MAINNET: 1,
}
export const idsToChains = invert(chainIds)

export const networks: { [id: number]: NetworkConfig } = {
  [chainIds.GOERLI]: {
    networkName: 'goerli',
    name: 'ETH-GOER-A',
    sdkName: 'Goerli',
    slaves: [
      {
        name: 'OPT-GOER-A',
        l2Rpc: 'https://goerli.optimism.io/',
        sdkName: 'OptimismGoerliTestnet',
        bridgeDeploymentBlock: 721970,
        syncBatchSize: 100_000,
      },
      {
        name: 'ARB-GOER-A',
        l2Rpc: 'https://goerli-rollup.arbitrum.io/rpc',
        sdkName: 'ArbitrumGoerliTestnet',
        bridgeDeploymentBlock: 211967,
        syncBatchSize: 100_000,
      },
    ],
    joinDeploymentBlock: 7492079,
    syncBatchSize: 100_000,
  },
  [chainIds.MAINNET]: {
    networkName: 'mainnet',
    name: 'ETH-MAIN-A',
    sdkName: 'Mainnet',
    slaves: [
      {
        name: 'OPT-MAIN-A',
        l2Rpc: 'https://mainnet.optimism.io/',
        sdkName: 'Optimism',
        bridgeDeploymentBlock: 21132286,
        syncBatchSize: 100_000,
      },
      {
        name: 'ARB-ONE-A',
        l2Rpc: 'https://arb1.arbitrum.io/rpc',
        sdkName: 'ArbitrumOne',
        bridgeDeploymentBlock: 21952628,
        syncBatchSize: 100_000,
      },
    ],
    joinDeploymentBlock: 15439251,
    syncBatchSize: 100_000,
  },
}
