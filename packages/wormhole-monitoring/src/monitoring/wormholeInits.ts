import { BigNumber, providers } from 'ethers/lib/ethers'
import { keccak256 } from 'ethers/lib/utils'

import { L2Sdk } from '../sdks'
import { delay } from '../utils'

export type Wormhole = {
  sourceDomain: string
  targetDomain: string
  receiver: string
  operator: string
  amount: BigNumber
  nonce: BigNumber
  timestamp: number
}

export async function syncWormholeInits({
  l2Provider,
  l2Sdk,
  startingBlock,
  blocksPerBatch,
}: {
  l2Provider: providers.Provider
  l2Sdk: L2Sdk
  startingBlock: number
  blocksPerBatch: number
}) {
  const ctx = {
    isSynced: false,
    wormholes: {} as { [hash: string]: Wormhole },
  }

  let syncBlock = startingBlock

  const filter = l2Sdk.wormholeGateway.filters.WormholeInitialized()

  setImmediate(async () => {
    while (true) {
      const currentBlock = (await l2Provider.getBlock('latest')).number // note: getting block number directly doesnt work b/c optimism doesnt support it
      const boundaryBlock = Math.min(syncBlock + blocksPerBatch, currentBlock)
      console.log(`Syncing ${syncBlock}...${boundaryBlock} (${(boundaryBlock - syncBlock).toLocaleString()} blocks)`)

      const newWormholes = await l2Sdk.wormholeGateway.queryFilter(filter, syncBlock, boundaryBlock)
      console.log(`Found ${newWormholes.length} new wormholes`)
      for (const w of newWormholes) {
        const hash = keccak256(w.data)
        ctx.wormholes[hash] = w.args.wormhole
      }

      const onTip = boundaryBlock === currentBlock
      if (onTip) {
        console.log('Syncing tip. Stalling....')
        ctx.isSynced = true
        await delay(5_000)
      }
      syncBlock = boundaryBlock
    }
  })

  return ctx
}
