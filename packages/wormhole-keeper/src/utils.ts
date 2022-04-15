import { ethers } from 'ethers'

export async function findNearestBlock(provider: ethers.providers.Provider, desiredTimestamp: number) {
  let currentBlockNumber = (await provider.getBlock('latest')).number
  let currentBlock = await provider.getBlock(currentBlockNumber)

  while (currentBlockNumber > 0 && currentBlock.timestamp > desiredTimestamp) {
    currentBlockNumber -= 30000
    currentBlock = await provider.getBlock(currentBlockNumber)
  }

  return currentBlock
}
