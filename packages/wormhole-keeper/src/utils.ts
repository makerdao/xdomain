import { ethers } from 'ethers'

export async function findNearestBlock(provider: ethers.providers.Provider, desiredTimestamp: number) {
  let currentBlockNumber = (await provider.getBlock('latest')).number // note: getting block number directly doesnt work b/c optimism doesnt support it
  let currentBlock = await provider.getBlock(currentBlockNumber)

  while (currentBlockNumber > 0 && currentBlock.timestamp > desiredTimestamp) {
    currentBlockNumber -= 30000
    currentBlock = await provider.getBlock(currentBlockNumber)
  }

  return currentBlock
}
