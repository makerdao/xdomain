import { PrismaClient } from '@prisma/client'
import { BigNumber, ethers, providers } from 'ethers'

import { onEveryFinalizedBlock } from './blockchain'
import { bridgeInvariant } from './monitoring/bridgeInvariant'
import { syncWormholeInits } from './monitoring/wormholeInits'
import { monitorWormholeMints } from './monitoring/wormholeMints'
import { getL1SdkBasedOnNetworkName, getL2SdkBasedOnNetworkName } from './sdks'
import { Metrics, NetworkConfig } from './types'

export async function monitor(network: NetworkConfig, l1Provider: providers.Provider, prisma: PrismaClient) {
  const metrics: Metrics = {}

  const l1Sdk = getL1SdkBasedOnNetworkName(network.sdkName, l1Provider)

  const cancelFns: (() => void)[] = []

  for (const domain of network.slaves) {
    console.log(`Setting up monitoring for ${domain.name}`)
    const l2Provider = new ethers.providers.JsonRpcProvider(domain.l2Rpc)
    const l2Sdk = getL2SdkBasedOnNetworkName(domain.sdkName, l2Provider)

    const ctx = await syncWormholeInits({
      domainName: domain.name,
      l2Provider,
      l2Sdk,
      blocksPerBatch: domain.syncBatchSize,
      startingBlock: domain.bridgeDeploymentBlock,
      prisma,
    })

    const { cancel } = await onEveryFinalizedBlock(async (blockNumber) => {
      console.log(`New block finalized: ${blockNumber}`)

      if (ctx.isSynced) {
        const newBadDebt = await monitorWormholeMints(blockNumber, l1Sdk, prisma)
        const previousBadDebt = BigNumber.from(metrics[`${domain.name}_wormhole_bad_debt`] || 0)

        metrics[`${domain.name}_wormhole_bad_debt`] = previousBadDebt.add(newBadDebt).toString()
      }

      const balances = await bridgeInvariant(l1Sdk, l2Sdk)
      metrics[`${domain.name}_wormhole_l1_dai_balance`] = balances.l1Balance
      metrics[`${domain.name}_wormhole_l2_dai_balance`] = balances.l2Balance
      metrics[`${domain.name}_wormhole_l1_block`] = await l1Provider.getBlockNumber()
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
