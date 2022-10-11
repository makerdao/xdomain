import { BigNumber, ethers, providers } from 'ethers'

import { bridgeInvariant, DomainId } from '../monitoring/bridgeInvariant'
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
import { makeMetricName } from '../utils'

export async function monitor({
  networkConfig,
  l1Provider,
  teleportRepository,
  flushRepository,
  settleRepository,
  synchronizerStatusRepository,
}: {
  networkConfig: NetworkConfig
  l1Provider: providers.Provider
  teleportRepository: TeleportRepository
  flushRepository: FlushRepository
  settleRepository: SettleRepository
  synchronizerStatusRepository: SynchronizerStatusRepository
}) {
  const metrics: Metrics = {}
  const synchronizers: GenericSynchronizer[] = []

  // sync data from master
  const l1Sdk = getL1SdkBasedOnNetworkName(networkConfig.sdkName, l1Provider)
  const synchronizer = new SettleEventsSynchronizer(
    new EthersBlockchainClient(l1Provider),
    synchronizerStatusRepository,
    networkConfig.name,
    networkConfig.joinDeploymentBlock,
    networkConfig.syncBatchSize,
    settleRepository,
    l1Sdk,
  )
  void synchronizer.run()
  synchronizers.push(synchronizer)

  // sync data from slaves
  for (const slave of networkConfig.slaves) {
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

    const labels = { domain: networkConfig.name, network: networkConfig.networkName }
    if (allSynced) {
      const newBadDebt = await monitorTeleportMints(l1Sdk, teleportRepository, blockNumber)
      const previousBadDebt = BigNumber.from(metrics[makeMetricName('teleport_bad_debt', labels)] || 0)

      metrics[makeMetricName('teleport_bad_debt', labels)] = previousBadDebt.add(newBadDebt).toString()
    }

    for (const slave of networkConfig.slaves) {
      const labels = { domain: slave.name, network: networkConfig.networkName }
      const l2Provider = new ethers.providers.JsonRpcProvider(slave.l2Rpc)
      const l2Sdk = getL2SdkBasedOnNetworkName(slave.sdkName, l2Provider)

      const balances = await bridgeInvariant(l1Sdk, l2Sdk, slave.name as DomainId)
      metrics[makeMetricName('teleport_l1_dai_balance', labels)] = balances.l1Balance
      metrics[makeMetricName('teleport_l2_dai_balance', labels)] = balances.l2Balance
      metrics[makeMetricName('teleport_bad_debt_l1_block', labels)] = blockNumber

      if (allSynced) {
        const { sinceLastFlush, debtToFlush } = await monitorTeleportFlush(
          l2Sdk,
          flushRepository,
          slave.name,
          networkConfig.name,
        )
        metrics[makeMetricName('teleport_last_flush_ms', labels)] = sinceLastFlush
        metrics[makeMetricName('teleport_debt_to_flush', labels)] = debtToFlush

        const { sinceLastSettle, debtToSettle } = await monitorTeleportSettle(
          l1Sdk,
          settleRepository,
          slave.name,
          networkConfig.name,
        )
        metrics[makeMetricName('teleport_last_settle_ms', labels)] = sinceLastSettle
        metrics[makeMetricName('teleport_debt_to_settle', labels)] = debtToSettle
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
