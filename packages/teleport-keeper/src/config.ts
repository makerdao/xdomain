import { invert } from 'lodash'

import { makeFinalizeMessageForArbitrum, makeFinalizeMessageForOptimism } from './domains'

export const chainIds = {
  GOERLI: 5,
  MAINNET: 1,
}
export const idsToChains = invert(chainIds)

const DAY = 60 * 60 * 24
export const networks = {
  [chainIds.GOERLI]: [
    {
      name: 'OPT-GOER-A',
      l2Rpc: 'https://goerli.optimism.io/',
      domainsToFlush: ['ETH-GOER-A'],
      maxTtlForMessages: 9 * DAY,
      teleportOutboundGateway: '0xd9e000C419F3aA4EA1C519497f5aF249b496a00f',
      messageFinalizer: makeFinalizeMessageForOptimism,
    },
    {
      name: 'ARB-GOER-A',
      l2Rpc: 'https://goerli-rollup.arbitrum.io/rpc',
      domainsToFlush: ['ETH-GOER-A'],
      maxTtlForMessages: 9 * DAY,
      teleportOutboundGateway: '0x8334a747731Be3a58bCcAf9a3D35EbC968806223',
      messageFinalizer: makeFinalizeMessageForArbitrum,
    },
  ],
  [chainIds.MAINNET]: [
    {
      name: 'OPT-MAIN-A',
      l2Rpc: 'https://mainnet.optimism.io/',
      domainsToFlush: ['ETH-MAIN-A'],
      maxTtlForMessages: 9 * DAY,
      teleportOutboundGateway: '0x18d2CF2296c5b29343755E6B7e37679818913f88',
      messageFinalizer: makeFinalizeMessageForOptimism,
    },
    {
      name: 'ARB-ONE-A',
      l2Rpc: 'https://arb1.arbitrum.io/rpc',
      domainsToFlush: ['ETH-MAIN-A'],
      maxTtlForMessages: 9 * DAY,
      teleportOutboundGateway: '0x5dBaf6F2bEDebd414F8d78d13499222347e59D5E',
      messageFinalizer: makeFinalizeMessageForArbitrum,
    },
  ],
}
