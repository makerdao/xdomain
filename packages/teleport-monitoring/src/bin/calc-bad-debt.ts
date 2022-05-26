import { BigNumber, ethers, providers } from 'ethers'

import { SyncStatusRepository } from '../db/SyncStatusRepository'
import { TeleportRepository } from '../db/TeleportRepository'
import { monitorTeleportMints } from '../monitoring/teleportMints'
import { getL1SdkBasedOnNetworkName, getL2SdkBasedOnNetworkName } from '../sdks'
import { SyncContext, syncTeleportInits } from '../sync/teleportInits'
import { NetworkConfig } from '../types'
import { delay, inChunks } from '../utils'
import { run } from './utils'

void run(calcBadDebt)

export async function calcBadDebt({
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
  const l1Sdk = getL1SdkBasedOnNetworkName(network.sdkName, l1Provider)
  const l1LatestBlock = await l1Provider.getBlockNumber()

  console.log(`Finding bad debt for ${network.name} until block: `, l1LatestBlock)

  for (const slave of network.slaves) {
    console.log(`Syncing debt for ${slave.name}`)
    const l2Provider = new ethers.providers.JsonRpcProvider(slave.l2Rpc)
    const l2Sdk = getL2SdkBasedOnNetworkName(slave.sdkName, l2Provider)

    await waitTillSynced(
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

  let cumulativeBadDebt = BigNumber.from(0)
  await inChunks(network.joinDeploymentBlock, l1LatestBlock, 100_000, async (from: number, to: number) => {
    cumulativeBadDebt = cumulativeBadDebt.add(await monitorTeleportMints(l1Sdk, teleportRepository, from, to))
  })

  console.log(`Cumulative bad debt for ${network.name}: ${cumulativeBadDebt}`)
}

async function waitTillSynced(ctx: SyncContext) {
  while (!ctx.isSynced) {
    await delay(1000)
  }
  ctx.cancel()
}
