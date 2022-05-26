import { Signer, Wallet } from 'ethers'
import { getContractAddress } from 'ethers/lib/utils'

/**
 * Get address of the future contract
 * @param signer
 * @param offset - default (0) means next address
 * @returns
 */
export async function getAddressOfNextDeployedContract(signer: Signer, offset: number = 0): Promise<string> {
  return getContractAddress({
    from: await signer.getAddress(),
    nonce: (await signer.getTransactionCount()) + offset,
  })
}

export async function getRandomAddress(): Promise<string> {
  const randomAddress = await Wallet.createRandom().getAddress()

  // we avoid "cheaper to use addresses" so gas cost is deterministic
  // https://medium.com/coinmonks/on-efficient-ethereum-addresses-3fef0596e263
  if (randomAddress.indexOf('00') !== -1) {
    return getRandomAddress()
  } else {
    return randomAddress
  }
}

export async function getRandomAddresses(n: number = 10): Promise<string[]> {
  const arr = [...Array(n).keys()]

  return await Promise.all(arr.map(getRandomAddress))
}
