import { providers } from 'ethers'
import { range } from 'lodash'

import { setIntervalAsync } from '../../utils'

const finalizedAfter = 5
export async function onEveryFinalizedBlock(
  onNewBlock: (blockNumber: number) => Promise<void>,
  provider: providers.Provider,
): Promise<{ cancel: () => void }> {
  const blocksToProcess: number[] = []

  let lastSeenBlockNumber = (await provider.getBlock('latest')).number // note: getting block number directly doesnt work b/c optimism doesnt support it
  const { cancel: cancelObserveBlockchain } = setIntervalAsync(async () => {
    const currentBlockNumber = (await provider.getBlock('latest')).number

    if (currentBlockNumber > lastSeenBlockNumber) {
      // todo what if we missed a block here
      const finalizedBlockNumber = currentBlockNumber - finalizedAfter //add all blocks

      const blocksToAdd = range(lastSeenBlockNumber + 1 - finalizedAfter, finalizedBlockNumber + 1)

      blocksToProcess.push(...blocksToAdd)

      lastSeenBlockNumber = currentBlockNumber
    }
  }, 1_000)

  const { cancel: cancelObserveQueue } = setIntervalAsync(async () => {
    while (blocksToProcess.length) {
      const block = blocksToProcess.shift()!
      await onNewBlock(block)
    }
  }, 1_000)

  return {
    cancel: () => {
      cancelObserveBlockchain()
      cancelObserveQueue()
    },
  }
}
