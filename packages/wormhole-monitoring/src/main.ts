import { ethers } from 'ethers'

import { onEveryFinalizedBlock } from './blockchain'
import { bridgeInvariant } from './monitoring/bridge-invariant'
import { isSynced, syncWormholeInits, wormholes } from './monitoring/wormhole-inits'
import { monitorWormholeMints } from './monitoring/wormholeMints'
import { getKovanSdk, getOptimismKovanSdk } from './sdk'
import { startServer } from './server'
import { Metrics } from './types'

export async function main() {
  const l1Provider = new ethers.providers.JsonRpcProvider(
    'https://eth-kovan.alchemyapi.io/v2/ezK0RQvjbWxV8EoUVG-iLifNmAUHgDp8',
  )
  const l2Provider = new ethers.providers.JsonRpcProvider('https://kovan.optimism.io/	')

  const l1Sdk = getKovanSdk(l1Provider as any)
  const l2Sdk = getOptimismKovanSdk(l2Provider as any)

  const metrics: Metrics = {}

  await onEveryFinalizedBlock(async (blockNumber) => {
    console.log('New block detected')

    if (isSynced.isSynced) {
      await monitorWormholeMints(wormholes, blockNumber, l1Sdk)
    }

    const balances = await bridgeInvariant(l1Sdk, l2Sdk)
    metrics['wormhole_l1_dai_balance'] = balances.l1Balance
    metrics['wormhole_l2_dai_balance'] = balances.l2Balance
    metrics['wormhole_l1_block'] = await l1Provider.getBlockNumber()
  }, l1Provider)

  await Promise.all([startServer(metrics), syncWormholeInits(l2Provider, l2Sdk)])
}
