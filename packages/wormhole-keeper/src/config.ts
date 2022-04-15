const chainIds = {
  KOVAN: 4,
}
const DAY = 60 * 60 * 24
export const networks = {
  [chainIds.KOVAN]: [
    {
      l2Rpc: 'https://kovan.optimism.io/',
      domainsToFlush: ['KOVAN-MASTER-1'],
      maxTtlForMessages: 9 * DAY,
      wormholeOutboundGateway: '0x0aeDbEf4105fdfc0db5A3Cd8C827bE2efA93ebe0',
      type: 'optimism',
    },
  ],
}
