import { PrismaClient, Wormhole } from '@prisma/client'
// import { WormholeUncheckedCreateInput } from '@prisma/client/index'
import { BigNumber, providers } from 'ethers/lib/ethers'
import { keccak256 } from 'ethers/lib/utils'

import { L2Sdk } from '../sdks'
import { delay } from '../utils'

export type OnChainWormhole = {
  sourceDomain: string
  targetDomain: string
  receiver: string
  operator: string
  amount: BigNumber
  nonce: BigNumber
  timestamp: number
}

export async function syncWormholeInits({
  domainName,
  l2Provider,
  l2Sdk,
  startingBlock,
  blocksPerBatch,
  prisma,
}: {
  domainName: string
  l2Provider: providers.Provider
  l2Sdk: L2Sdk
  startingBlock: number
  blocksPerBatch: number
  prisma: PrismaClient
}) {
  let cancelled = false
  const ctx = {
    isSynced: false,
    cancel: () => {
      cancelled = true
    },
  }

  const syncStatus = await prisma.syncStatus.findUnique({ where: { domain: domainName } })
  let syncBlock = syncStatus?.block ?? startingBlock

  const filter = l2Sdk.wormholeGateway.filters.WormholeInitialized()

  setImmediate(async () => {
    //eslint-disable-next-line
    while (!cancelled) {
      const currentBlock = (await l2Provider.getBlock('latest')).number // note: getting block number directly doesnt work b/c optimism doesnt support it
      const boundaryBlock = Math.min(syncBlock + blocksPerBatch, currentBlock)
      console.log(`Syncing ${syncBlock}...${boundaryBlock} (${(boundaryBlock - syncBlock).toLocaleString()} blocks)`)

      const newWormholes = await l2Sdk.wormholeGateway.queryFilter(filter, syncBlock, boundaryBlock)
      console.log(`Found ${newWormholes.length} new wormholes`)
      const modelsToCreate: Omit<Wormhole, 'id'>[] = newWormholes.map((w) => {
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
      await prisma.$transaction([
        prisma.wormhole.createMany({ data: modelsToCreate }),
        prisma.syncStatus.upsert({
          create: { domain: domainName, block: boundaryBlock },
          update: { domain: domainName, block: boundaryBlock },
          where: { domain: domainName },
        }),
      ])

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
