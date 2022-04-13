import { formatBytes32String, formatEther } from 'ethers/lib/utils'

import { WormholeOutboundGateway } from '../sdk/types'

export async function flushL2Gateway(gateway: WormholeOutboundGateway, domain: string) {
  const domainEncoded = formatBytes32String(domain)
  const daiToFlush = await gateway.batchedDaiToFlush(domainEncoded)

  console.log(`DAI waiting to be flushed to ${domain}: ${formatEther(daiToFlush)}`)

  if (daiToFlush.eq(0)) {
    console.log('Skipping...')
    return
  }

  await gateway.flush(domainEncoded)
  console.log(`Domain ${domain} FLUSHED!`)
}
