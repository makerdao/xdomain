import { sleep } from '@eth-optimism/core-utils'
import { ContractTransaction, providers } from 'ethers'

export async function waitForTx(
  tx: Promise<ContractTransaction>,
  _confirmations?: number,
): Promise<providers.TransactionReceipt> {
  const resolvedTx = await tx
  const confirmations = _confirmations ?? chainIdToConfirmationsNeededForFinalization(resolvedTx.chainId)

  // we retry .wait b/c sometimes it fails for the first time
  for (let attempts = 1; attempts <= 12; attempts++) {
    try {
      const txReceipt = await resolvedTx.wait(confirmations)
      if (txReceipt as any) return txReceipt
      else console.log(`Transaction .wait() returned ${txReceipt}`)
    } catch (e) {
      console.log(`Transaction .wait() error: ${e}`)
    }
    console.log(`Retrying in 10s...`)
    await sleep(10000)
  }
  throw new Error(
    `Transaction .wait(${confirmations}) didn't succeed after several attempts. Transaction: ${resolvedTx}`,
  )
}

function chainIdToConfirmationsNeededForFinalization(chainId: number): number {
  const defaultWhenReorgsPossible = 3
  const defaultForInstantFinality = 0

  // covers mainnet and public testnets
  if (chainId < 6) {
    return defaultWhenReorgsPossible
  } else {
    return defaultForInstantFinality
  }
}
