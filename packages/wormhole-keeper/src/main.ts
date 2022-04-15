import { ethers } from 'ethers'

import { getOptimismKovanSdk } from './sdk'

export async function main() {
  const l1Provider = new ethers.providers.JsonRpcProvider(
    'https://eth-kovan.alchemyapi.io/v2/ezK0RQvjbWxV8EoUVG-iLifNmAUHgDp8',
  )
  const l1Signer = new ethers.Wallet('42ddb062a194c46229678c4e001a8a169cab351b3d5d12f683ecf3a5a54ccc40', l1Provider) //0xDD55d89656446185Cf891f37bC2ea2B70e325AeE
  const l2Provider = new ethers.providers.JsonRpcProvider('https://kovan.optimism.io/')
  const l2Signer = new ethers.Wallet('42ddb062a194c46229678c4e001a8a169cab351b3d5d12f683ecf3a5a54ccc40', l2Provider) //0xDD55d89656446185Cf891f37bC2ea2B70e325AeE
  const l2Sdk = getOptimismKovanSdk(l2Signer)
  const domainToFlush = 'KOVAN-MASTER-1'
  const MAX_TTL_FOR_MESSAGES = 60 * 60 * 24 * 9 // 9 days
}
