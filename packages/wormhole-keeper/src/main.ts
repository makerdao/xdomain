import { ethers } from 'ethers'

import { getOptimismKovanSdk } from '../sdk'
import { flushL2Gateway } from './l2'

export async function main() {
  const l2Provider = new ethers.providers.JsonRpcProvider('https://kovan.optimism.io/	')
  const l2Signer = new ethers.Wallet('42ddb062a194c46229678c4e001a8a169cab351b3d5d12f683ecf3a5a54ccc40', l2Provider) //0xDD55d89656446185Cf891f37bC2ea2B70e325AeE
  const l2Sdk = getOptimismKovanSdk(l2Signer)
  const domainToFlush = 'KOVAN-MASTER-1'

  await flushL2Gateway(l2Sdk.WormholeOutboundGateway, domainToFlush)
}
