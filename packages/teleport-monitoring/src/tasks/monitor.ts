import { BigNumber, ethers, providers } from 'ethers'

import { bridgeInvariant } from '../monitoring/bridgeInvariant'
import { monitorTeleportFlush } from '../monitoring/teleportFlush'
import { monitorTeleportMints } from '../monitoring/teleportMints'
import { monitorTeleportSettle } from '../monitoring/teleportSettle'
import { EthersBlockchainClient } from '../peripherals/blockchain'
import { onEveryFinalizedBlock } from '../peripherals/blockchain/onEveryFinalizedBlock'
import { FlushRepository } from '../peripherals/db/FlushRepository'
import { SettleRepository } from '../peripherals/db/SettleRepository'
import { SynchronizerStatusRepository } from '../peripherals/db/SynchronizerStatusRepository'
import { TeleportRepository } from '../peripherals/db/TeleportRepository'
import { getL1SdkBasedOnNetworkName, getL2SdkBasedOnNetworkName } from '../sdks'
import { FlushEventsSynchronizer, InitEventsSynchronizer, SettleEventsSynchronizer } from '../synchronizers'
import { GenericSynchronizer } from '../synchronizers/GenericSynchronizer'
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
  const synchronizers: GenericSynchronizer[] = []

  // sync data from master
  const l1Sdk = getL1SdkBasedOnNetworkName(network.sdkName, l1Provider)
  const synchronizer = new SettleEventsSynchronizer(
    new EthersBlockchainClient(l1Provider),
    synchronizerStatusRepository,
    network.name,
    network.joinDeploymentBlock,
    network.syncBatchSize,
    settleRepository,
    l1Sdk,
  )
  void synchronizer.run()
  synchronizers.push(synchronizer)

  // sync data from slaves
  for (const slave of network.slaves) {
    const l2Provider = new ethers.providers.JsonRpcProvider(slave.l2Rpc)
    const l2Sdk = getL2SdkBasedOnNetworkName(slave.sdkName, l2Provider)

    const initEventsSynchronizer = new InitEventsSynchronizer(
      new EthersBlockchainClient(l2Provider),
      synchronizerStatusRepository,
      slave.name,
      slave.bridgeDeploymentBlock,
      slave.syncBatchSize,
      teleportRepository,
      l2Sdk,
    )
    void initEventsSynchronizer.run()
    synchronizers.push(initEventsSynchronizer)

    const flushEventsSynchronizer = new FlushEventsSynchronizer(
      new EthersBlockchainClient(l2Provider),
      synchronizerStatusRepository,
      slave.name,
      slave.bridgeDeploymentBlock,
      slave.syncBatchSize,
      flushRepository,
      l2Sdk,
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
