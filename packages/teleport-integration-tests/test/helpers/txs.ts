import { ContractReceipt, ContractTransaction } from 'ethers'

import { retry } from './async'

export async function waitForTx(tx: Promise<ContractTransaction>, _confirmations?: number): Promise<ContractReceipt> {
  const resolvedTx = await tx
  const confirmations = _confirmations ?? chainIdToConfirmationsNeededForFinalization(resolvedTx.chainId)

  // retry .wait b/c sometimes it fails for the first time (probably due to a problem with provider)
  return await retry(() => resolvedTx.wait(confirmations))
}

function chainIdToConfirmationsNeededForFinalization(chainId: number): number {
  const defaultWhenReorgsPossible = 3
  const defaultForInstantFinality = 1

  // covers mainnet and public testnets
  if (
    (chainId > 0 && chainId < 6) ||
    chainId === 42 // kovan
  ) {
    return defaultWhenReorgsPossible
  } else {
    return defaultForInstantFinality
  }
}
