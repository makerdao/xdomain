import { ContractTransaction, providers } from 'ethers'

export async function waitForTx(
  tx: Promise<ContractTransaction>,
  _confirmations?: number,
  maxRetries: number = 0,
): Promise<providers.TransactionReceipt> {
  let resolvedTx = null

  for (let retries = 0; retries <= maxRetries; retries++) {
    try {
      resolvedTx = await tx
      break
    } catch (err) {}
  }
  if (!resolvedTx) throw new Error('Max retried exceeded while waiting for resolvedTx in waitForTx()')

  const confirmations = _confirmations ?? chainIdToConfirmationsNeededForFinalization(resolvedTx!.chainId)

  // we retry .wait b/c sometimes it fails for the first time
  for (let retries = 0; retries <= maxRetries; retries++) {
    try {
      return await resolvedTx!.wait(confirmations)
    } catch (err) {}
  }
  throw new Error('Max retried exceeded while waiting for receipt in waitForTx() ')
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
