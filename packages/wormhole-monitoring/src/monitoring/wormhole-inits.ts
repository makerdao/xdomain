import { BigNumber, providers } from 'ethers/lib/ethers'
import { keccak256 } from 'ethers/lib/utils'

import { L2Sdk } from '../types'
import { delay } from '../utils'

// todo: this needs to go to some kind of config file
const startingBlock = 1791185 // block of L2WormholeGateway deployment
const syncBatch = 100_000
type Wormhole = {
  sourceDomain: string
  targetDomain: string
  receiver: string
  operator: string
  amount: BigNumber
  nonce: BigNumber
  timestamp: number
}
export const wormholes: { [hash: string]: Wormhole } = {}
export const isSynced = { isSynced: false }

export async function syncWormholeInits(l2Provider: providers.Provider, l2Sdk: L2Sdk) {
  let syncBlock = startingBlock

  const filter = l2Sdk.wormholeGateway.filters.WormholeInitialized()

  while (true) {
    const currentBlock = (await l2Provider.getBlock('latest')).number // note: getting block number directly doesnt work b/c optimism doesnt support it
    const boundaryBlock = Math.min(syncBlock + syncBatch, currentBlock)
    console.log(`Syncing ${syncBlock}...${boundaryBlock} (${(boundaryBlock - syncBlock).toLocaleString()} blocks)`)

    const newWormholes = await l2Sdk.wormholeGateway.queryFilter(filter, syncBlock, boundaryBlock)
    console.log(`Found ${newWormholes.length} new wormholes`)
    for (const w of newWormholes) {
      const hash = keccak256(w.data)
      wormholes[hash] = w.args.wormhole
    }

    const onTip = boundaryBlock === currentBlock
    if (onTip) {
      console.log('Syncing tip. Stalling....')
      isSynced.isSynced = true
      await delay(5_000)
    }
    syncBlock = boundaryBlock
  }
}
