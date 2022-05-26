import { BigNumber, ethers, providers } from 'ethers'

import { onEveryFinalizedBlock } from '../blockchain'
import { SyncStatusRepository } from '../db/SyncStatusRepository'
import { TeleportRepository } from '../db/TeleportRepository'
import { bridgeInvariant } from '../monitoring/bridgeInvariant'
import { monitorTeleportMints } from '../monitoring/teleportMints'
import { getL1SdkBasedOnNetworkName, getL2SdkBasedOnNetworkName } from '../sdks'
import { startServer } from '../server'
import { SyncContext, syncTeleportInits } from '../sync/teleportInits'
import { Metrics, NetworkConfig } from '../types'
import { run } from './utils'

void run(async ({ network, l1Provider, teleportRepository, syncStatusRepository }) => {
  const { metrics } = await monitor({ network, l1Provider, teleportRepository, syncStatusRepository })

  await startServer(metrics)
})

export async function monitor({
  network,
  l1Provider,
  teleportRepository,
  syncStatusRepository,
}: {
  network: NetworkConfig
  l1Provider: providers.Provider
  teleportRepository: TeleportRepository
  syncStatusRepository: SyncStatusRepository
}) {
  const metrics: Metrics = {}

  const l1Sdk = getL1SdkBasedOnNetworkName(network.sdkName, l1Provider)

  // sync data from slaves
  const syncContexts: SyncContext[] = []
  for (const slave of network.slaves) {
    const l2Provider = new ethers.providers.JsonRpcProvider(slave.l2Rpc)
    const l2Sdk = getL2SdkBasedOnNetworkName(slave.sdkName, l2Provider)

    syncContexts.push(
      await syncTeleportInits({
        domainName: slave.name,
        l2Provider,
        l2Sdk,
        blocksPerBatch: slave.syncBatchSize,
        startingBlock: slave.bridgeDeploymentBlock,
        teleportRepository,
        syncStatusRepository,
      }),
    )
  }

  // monitor
  const { cancel: cancelBlockWatcher } = await onEveryFinalizedBlock(async (blockNumber) => {
    console.log(`New block finalized: ${blockNumber}`)

    const allSynced = syncContexts.every((sc) => sc.isSynced)

    if (allSynced) {
      const newBadDebt = await monitorTeleportMints(l1Sdk, teleportRepository, blockNumber)
      const previousBadDebt = BigNumber.from(metrics[`teleport_bad_debt{domain="${network.name}"}`] || 0)

      metrics[`teleport_bad_debt{domain="${network.name}"}`] = previousBadDebt.add(newBadDebt).toString()
    }

    for (const slave of network.slaves) {
      const l2Provider = new ethers.providers.JsonRpcProvider(slave.l2Rpc)
      const l2Sdk = getL2SdkBasedOnNetworkName(slave.sdkName, l2Provider)

      const balances = await bridgeInvariant(l1Sdk, l2Sdk)
      metrics[`teleport_l1_dai_balance{domain="${slave.name}"}`] = balances.l1Balance
      metrics[`teleport_l2_dai_balance{domain="${slave.name}"}`] = balances.l2Balance
      metrics[`teleport_l1_block{domain="${slave.name}"}`] = blockNumber
    }
  }, l1Provider)

  return {
    metrics,
    cancel: () => {
      cancelBlockWatcher()
      syncContexts.forEach((sc) => sc.cancel())
    },
  }
}
