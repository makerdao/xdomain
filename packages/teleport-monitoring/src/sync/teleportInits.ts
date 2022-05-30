import { Teleport } from '@prisma/client'
// import { TeleportUncheckedCreateInput } from '@prisma/client/index'
import { BigNumber, providers } from 'ethers/lib/ethers'
import { keccak256 } from 'ethers/lib/utils'

import { SyncStatusRepository } from '../db/SyncStatusRepository'
import { TeleportRepository } from '../db/TeleportRepository'
import { L2Sdk } from '../sdks'
import { delay } from '../utils'

export type OnChainTeleport = {
  sourceDomain: string
  targetDomain: string
  receiver: string
  operator: string
  amount: BigNumber
  nonce: BigNumber
  timestamp: number
}

export type SyncContext = {
  isSynced: boolean
  cancel: () => void
}

export async function syncTeleportInits({
  domainName,
  l2Provider,
  l2Sdk,
  startingBlock,
  blocksPerBatch,
  syncStatusRepository,
  teleportRepository,
}: {
  domainName: string
  l2Provider: providers.Provider
  l2Sdk: L2Sdk
  startingBlock: number
  blocksPerBatch: number
  syncStatusRepository: SyncStatusRepository
  teleportRepository: TeleportRepository
}): Promise<SyncContext> {
  let cancelled = false
  const ctx: SyncContext = {
    isSynced: false,
    cancel: () => {
      cancelled = true
    },
  }

  const syncStatus = await syncStatusRepository.findByDomainName(domainName)
  let syncBlock = syncStatus?.block ?? startingBlock

  const filter = l2Sdk.teleportGateway.filters.WormholeInitialized()

  setImmediate(async () => {
    //eslint-disable-next-line
    while (!cancelled) {
      const currentBlock = (await l2Provider.getBlock('latest')).number // note: getting block number directly doesnt work b/c optimism doesnt support it
      const boundaryBlock = Math.min(syncBlock + blocksPerBatch, currentBlock)
      console.log(`Syncing ${syncBlock}...${boundaryBlock} (${(boundaryBlock - syncBlock).toLocaleString()} blocks)`)

      const newTeleports = await l2Sdk.teleportGateway.queryFilter(filter, syncBlock, boundaryBlock)
      console.log(`Found ${newTeleports.length} new teleports`)
      const modelsToCreate: Omit<Teleport, 'id'>[] = newTeleports.map((w) => {
        const hash = keccak256(w.data)
        return {
          hash,
          sourceDomain: w.args[0].sourceDomain,
          targetDomain: w.args[0].targetDomain,
          amount: w.args[0].amount.toString(),
          nonce: w.args[0].nonce.toString(),
          operator: w.args[0].operator,
          receiver: w.args[0].receiver,
          timestamp: w.args[0].timestamp,
        }
      })

      // update sync block
      await teleportRepository.transaction(async (tx) => {
        await teleportRepository.createMany(modelsToCreate, tx)
        await syncStatusRepository.upsert({ domain: domainName, block: boundaryBlock }, tx)
      })

      syncBlock = boundaryBlock
      const onTip = boundaryBlock === currentBlock
      if (onTip) {
        console.log('Syncing tip. Stalling....')
        ctx.isSynced = true
        await delay(5_000)
      }
    }
  })

  return ctx
}
