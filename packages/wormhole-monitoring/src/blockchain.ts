import { providers } from 'ethers'

import { setIntervalAsync } from './utils'

const finalizedAfter = 5
export async function onEveryFinalizedBlock(
  onNewBlock: (blockNumber: number) => Promise<void>,
  provider: providers.Provider,
) {
  const blocksToProcess: number[] = []

  let lastSeenBlockNumber = (await provider.getBlock('latest')).number // note: getting block number directly doesnt work b/c optimism doesnt support it
  void setIntervalAsync(async () => {
    const currentBlockNumber = (await provider.getBlock('latest')).number

    if (currentBlockNumber > lastSeenBlockNumber) {
      // todo what if we missed a block here
      const finalizedBlockNumber = currentBlockNumber - finalizedAfter //add all blocks

      console.log(`New finalized block detected: ${finalizedBlockNumber}`)
      blocksToProcess.push(finalizedBlockNumber)

      lastSeenBlockNumber = currentBlockNumber
    }
  }, 1_000)

  void setIntervalAsync(async () => {
    while (blocksToProcess.length) {
      const block = blocksToProcess.shift()!
      await onNewBlock(block)
    }
  }, 1_000)
}
