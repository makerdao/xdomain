import { BigNumber, ethers, providers } from 'ethers'

import { onEveryFinalizedBlock } from './blockchain'
import { SyncStatusRepository } from './db/SyncStatusRepository'
import { TeleportRepository } from './db/TeleportRepository'
import { bridgeInvariant } from './monitoring/bridgeInvariant'
import { monitorTeleportMints } from './monitoring/teleportMints'
import { getL1SdkBasedOnNetworkName, getL2SdkBasedOnNetworkName } from './sdks'
import { syncTeleportInits } from './sync/teleportInits'
import { Metrics, NetworkConfig } from './types'

export async function monitor(
  network: NetworkConfig,
  l1Provider: providers.Provider,
  teleportRepository: TeleportRepository,
  syncStatusRepository: SyncStatusRepository,
) {
  const metrics: Metrics = {}

  const l1Sdk = getL1SdkBasedOnNetworkName(network.sdkName, l1Provider)

  const cancelFns: (() => void)[] = []

  for (const domain of network.slaves) {
    console.log(`Setting up monitoring for ${domain.name}`)
    const l2Provider = new ethers.providers.JsonRpcProvider(domain.l2Rpc)
    const l2Sdk = getL2SdkBasedOnNetworkName(domain.sdkName, l2Provider)

    const ctx = await syncTeleportInits({
      domainName: domain.name,
      l2Provider,
      l2Sdk,
      blocksPerBatch: domain.syncBatchSize,
      startingBlock: domain.bridgeDeploymentBlock,
      teleportRepository,
      syncStatusRepository,
    })

    const { cancel } = await onEveryFinalizedBlock(async (blockNumber) => {
      console.log(`New block finalized: ${blockNumber}`)

      if (ctx.isSynced) {
        const newBadDebt = await monitorTeleportMints(blockNumber, l1Sdk, teleportRepository)
        const previousBadDebt = BigNumber.from(metrics[`${domain.name}_teleport_bad_debt`] || 0)

        metrics[`teleport_bad_debt{domain="${domain.name}"}`] = previousBadDebt.add(newBadDebt).toString()
      }

      const balances = await bridgeInvariant(l1Sdk, l2Sdk)
      metrics[`teleport_l1_dai_balance{domain="${domain.name}"}`] = balances.l1Balance
      metrics[`teleport_l2_dai_balance{domain="${domain.name}"}`] = balances.l2Balance
      metrics[`teleport_l1_block{domain="${domain.name}"}`] = blockNumber
    }, l1Provider)
    cancelFns.push(ctx.cancel, cancel)
  }

  return {
    metrics,
    cancel: () => {
      cancelFns.forEach((c) => c())
    },
  }
}
