import { ethers, providers } from 'ethers'

export async function impersonateAccount(address: string, provider: providers.Provider): Promise<ethers.Signer> {
  await (provider as any).send('hardhat_impersonateAccount', [address])

  await mintEther(address, provider)

  const signer = (provider as any).getSigner(address)

  return signer
}

export async function mintEther(address: string, provider: ethers.providers.Provider): Promise<void> {
  await (provider as any).send('hardhat_setBalance', [address, '0x56bc75e2d63100000'])
}

export async function mineABunchOfBlocks(provider: ethers.providers.Provider) {
  await (provider as any).send('hardhat_mine', ['0x9', '0x1'])
}
