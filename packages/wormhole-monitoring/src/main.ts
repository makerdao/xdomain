import { ethers } from 'ethers'

import { idsToChains, networks } from './config'
import { monitor } from './monitor'

export async function main(l1Rpc: string) {
  const l1Provider = new ethers.providers.JsonRpcProvider(l1Rpc)

  const chainId = (await l1Provider.getNetwork()).chainId
  const networkName = idsToChains[chainId]
  const network = networks[chainId]

  if (!networkName || !network) {
    throw new Error(`Can't find config for network with id: ${chainId}`)
  }

  console.log(`Loaded config for ${networkName}`)

  await monitor(network, l1Provider)
}
