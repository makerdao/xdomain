import { invert } from 'lodash'

import { makeFinalizeMessageForArbitrum, makeFinalizeMessageForOptimism } from './domains'

export const chainIds = {
  KOVAN: 42,
  RINKEBY: 4,
}
export const idsToChains = invert(chainIds)

const DAY = 60 * 60 * 24
export const networks = {
  [chainIds.KOVAN]: [
    {
      name: 'KOVAN-SLAVE-OPTIMISM-1',
      l2Rpc: 'https://kovan.optimism.io/',
      domainsToFlush: ['KOVAN-MASTER-1'],
      maxTtlForMessages: 9 * DAY,
      wormholeOutboundGateway: '0x0aeDbEf4105fdfc0db5A3Cd8C827bE2efA93ebe0',
      messageFinalizer: makeFinalizeMessageForOptimism,
    },
  ],
  [chainIds.RINKEBY]: [
    {
      name: 'RINKEBY-SLAVE-ARBITRUM-1',
      l2Rpc: 'https://rinkeby.arbitrum.io/rpc',
      domainsToFlush: ['RINKEBY-MASTER-1'],
      maxTtlForMessages: 9 * DAY,
      wormholeOutboundGateway: '0xEbA80E9d7C6C2F575a642a43199e32F47Bbd1306',
      messageFinalizer: makeFinalizeMessageForArbitrum,
    },
  ],
}
