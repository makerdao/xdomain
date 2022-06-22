import { BigNumber, ethers, providers } from 'ethers'

import { onEveryFinalizedBlock } from '../blockchain'
import { FlushRepository } from '../db/FlushRepository'
import { SettleRepository } from '../db/SettleRepository'
import { SynchronizerStatusRepository } from '../db/SynchronizerStatusRepository'
import { TeleportRepository } from '../db/TeleportRepository'
import { bridgeInvariant } from '../monitoring/bridgeInvariant'
import { monitorTeleportFlush } from '../monitoring/teleportFlush'
import { monitorTeleportMints } from '../monitoring/teleportMints'
import { monitorTeleportSettle } from '../monitoring/teleportSettle'
import { getL1SdkBasedOnNetworkName, getL2SdkBasedOnNetworkName } from '../sdks'
import { BaseSynchronizer } from '../synchronizers/BaseSynchronizer'
import { FlushEventsSynchronizer } from '../synchronizers/FlushEventsSynchronizer'
import { InitEventsSynchronizer } from '../synchronizers/InitEventsSynchronizer'
import { SettleEventsSynchronizer } from '../synchronizers/SettleEventsSynchronizer'
import { Metrics, NetworkConfig } from '../types'

export async function monitor({
  network,
  l1Provider,
  teleportRepository,
  flushRepository,
  settleRepository,
  synchronizerStatusRepository,
}: {
  network: NetworkConfig
  l1Provider: providers.Provider
  teleportRepository: TeleportRepository
  flushRepository: FlushRepository
  settleRepository: SettleRepository
  synchronizerStatusRepository: SynchronizerStatusRepository
}) {
  const metrics: Metrics = {}
  const synchronizers: BaseSynchronizer[] = []

  // sync data from master
  const l1Sdk = getL1SdkBasedOnNetworkName(network.sdkName, l1Provider)
  const synchronizer = new SettleEventsSynchronizer(
    l1Provider,
    synchronizerStatusRepository,
    settleRepository,
    l1Sdk,
    network.name,
    network.joinDeploymentBlock,
    network.syncBatchSize,
  )
  void synchronizer.run()
  synchronizers.push(synchronizer)

  // sync data from slaves
  for (const slave of network.slaves) {
    const l2Provider = new ethers.providers.JsonRpcProvider(slave.l2Rpc)
    const l2Sdk = getL2SdkBasedOnNetworkName(slave.sdkName, l2Provider)

    const initEventsSynchronizer = new InitEventsSynchronizer(
      l2Provider,
      synchronizerStatusRepository,
      teleportRepository,
      l2Sdk,
      slave.name,
      slave.bridgeDeploymentBlock,
      slave.syncBatchSize,
    )
    void initEventsSynchronizer.run()
    synchronizers.push(initEventsSynchronizer)

    const flushEventsSynchronizer = new FlushEventsSynchronizer(
      l2Provider,
      synchronizerStatusRepository,
      flushRepository,
      l2Sdk,
      slave.name,
      slave.bridgeDeploymentBlock,
      slave.syncBatchSize,
    )
    void flushEventsSynchronizer.run()
    synchronizers.push(flushEventsSynchronizer)
  }

  // monitor
  const { cancel: cancelBlockWatcher } = await onEveryFinalizedBlock(async (blockNumber) => {
    console.log(`New block finalized: ${blockNumber}`)

    const allSynced = synchronizers.every((sc) => sc.state === 'synced')

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
      metrics[`teleport_bad_debt_l1_block{domain="${slave.name}"}`] = blockNumber

      if (allSynced) {
        const { sinceLastFlush, debtToFlush } = await monitorTeleportFlush(
          l2Sdk,
          flushRepository,
          slave.name,
          network.name,
        )
        metrics[`teleport_last_flush_ms{domain="${slave.name}"}`] = sinceLastFlush
        metrics[`teleport_debt_to_flush{domain="${slave.name}"}`] = debtToFlush

        const { sinceLastSettle, debtToSettle } = await monitorTeleportSettle(
          l1Sdk,
          settleRepository,
          slave.name,
          network.name,
        )
        metrics[`teleport_last_settle_ms{domain="${slave.name}"}`] = sinceLastSettle
        metrics[`teleport_debt_to_settle{domain="${slave.name}"}`] = debtToSettle
      }
    }
  }, l1Provider)

  return {
    metrics,
    cancel: () => {
      cancelBlockWatcher()
      synchronizers.forEach((sc) => sc.stop())
    },
  }
}
