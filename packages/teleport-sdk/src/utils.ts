import { providers } from 'ethers'

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const waitForTxReceipt = async (
  provider: providers.Provider,
  txHash: string,
  txDescription?: string,
  maxAttempts?: number,
): Promise<providers.TransactionReceipt> => {
  const maxAttempts_ = maxAttempts ?? 10
  let receipt = null
  let attempt = 1
  while (!receipt && attempt <= maxAttempts_) {
    receipt = await provider.getTransactionReceipt(txHash)
    if (receipt) {
      return receipt
    } else {
      await sleep(1000 * attempt)
      attempt++
    }
  }
  throw new Error(
    `waitForTxReceipt: getTransactionReceipt(${
      txDescription ?? 'tx'
    } hash=${txHash}) returned no receipt after ${maxAttempts_} attempts.`,
  )
}
