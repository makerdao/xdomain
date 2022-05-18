import { invert } from 'lodash'

import { NetworkConfig } from './types'

export const chainIds = {
  KOVAN: 42,
  RINKEBY: 4,
}
export const idsToChains = invert(chainIds)

export const networks: { [id: number]: NetworkConfig } = {
  [chainIds.KOVAN]: {
    sdkName: 'Kovan',
    slaves: [
      {
        name: 'KOVAN-SLAVE-OPTIMISM-1',
        l2Rpc: 'https://kovan.optimism.io/',
        sdkName: 'OptimismKovan',
        bridgeDeploymentBlock: 1791185,
        syncBatchSize: 100_000,
      },
    ],
  },
  // [chainIds.RINKEBY]: [
  //   {
  //     name: 'RINKEBY-SLAVE-ARBITRUM-1',
  //     l2Rpc: 'https://rinkeby.arbitrum.io/rpc',
  //     domainsToFlush: ['RINKEBY-MASTER-1'],
  //     maxTtlForMessages: 9 * DAY,
  //     wormholeOutboundGateway: '0x327c2f7aCd799f31535880Af54C2bCAB1384Ecc3',
  //     messageFinalizer: makeFinalizeMessageForArbitrum,
  //   },
  // ],
}
