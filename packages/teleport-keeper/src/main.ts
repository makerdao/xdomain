import { Contract, ethers } from 'ethers'

import { WormholeOutboundGateway } from './abis/WormholeOutboundGateway'
import { idsToChains, networks } from './config'
import { keep } from './keep'

export async function main(l1Rpc: string, privKey: string) {
  const l1Provider = new ethers.providers.JsonRpcProvider(l1Rpc)
  const l1Signer = new ethers.Wallet(privKey, l1Provider)

  const chainId = (await l1Provider.getNetwork()).chainId
  const networkName = idsToChains[chainId]
  const config = networks[chainId]

  if (!networkName || !config) {
    throw new Error(`Can't find config for network with id: ${chainId}`)
  }

  console.log(`Running on ${networkName}. Keeping ${config.length} deployments.`)

  for (const c of config) {
    const l2Provider = new ethers.providers.JsonRpcProvider(c.l2Rpc)
    const l2Signer = l1Signer.connect(l2Provider)

    for (const domainToFlush of c.domainsToFlush) {
      console.log(`\nFlushing ${c.name} -> ${domainToFlush}`)

      await keep({
        domainToFlush: domainToFlush,
        finalizeMessage: await c.messageFinalizer(l1Signer, l2Signer),
        l2Signer,
        maxTtlForMessages: c.maxTtlForMessages,
        teleportOutboundGateway: new Contract(
          c.teleportOutboundGateway,
          require('./abis/WormholeOutboundGateway.json'),
          l2Signer,
        ) as WormholeOutboundGateway,
      })
    }
  }
}
