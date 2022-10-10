import { Signer } from 'ethers'
import { formatBytes32String, formatEther, parseBytes32String } from 'ethers/lib/utils'

import { WormholeOutboundGateway } from './abis/WormholeOutboundGateway'
import { FinalizeMessage } from './domains'
import { findNearestBlock } from './utils'

export async function keep({
  teleportOutboundGateway,
  domainToFlush,
  maxTtlForMessages,
  l2Signer,
  finalizeMessage,
}: {
  teleportOutboundGateway: WormholeOutboundGateway
  domainToFlush: string
  maxTtlForMessages: number
  l2Signer: Signer
  finalizeMessage: FinalizeMessage
}) {
  const flushedDomain = parseBytes32String(await teleportOutboundGateway.domain())

  console.log(`============ FLUSHING DEBT from ${flushedDomain} to ${domainToFlush} ============`)
  await flushL2Gateway(teleportOutboundGateway, domainToFlush)

  console.log(`============ FINALIZING PAST FLUSHES from ${flushedDomain} to ${domainToFlush} ==`)
  const cutoffTimestamp = new Date().getTime() / 1000 - maxTtlForMessages
  const cutoffBlock = await findNearestBlock(l2Signer.provider!, cutoffTimestamp)
  await findMessagesToFlush(teleportOutboundGateway, domainToFlush, cutoffBlock.number, finalizeMessage)
}

async function flushL2Gateway(gateway: WormholeOutboundGateway, targetDomain: string) {
  const targetDomainEncoded = formatBytes32String(targetDomain)
  const daiToFlush = await gateway.batchedDaiToFlush(targetDomainEncoded)

  const flushedDomain = parseBytes32String(await gateway.domain())
  console.log(`DAI waiting to be flushed from ${flushedDomain} to ${targetDomain}: ${formatEther(daiToFlush)}`)

  if (daiToFlush.eq(0)) {
    console.log('Skipping...')
    return
  }

  await gateway.flush(targetDomainEncoded)

  console.log(`Domain ${flushedDomain} FLUSHED!`)
}

async function findMessagesToFlush(
  gateway: WormholeOutboundGateway,
  domain: string,
  cutoffBlock: number,
  finalizeMessage: FinalizeMessage,
) {
  const domainEncoded = formatBytes32String(domain)
  const filter = gateway.filters.Flushed(domainEncoded)

  const flushesWithinCutoff = await gateway.queryFilter(filter, cutoffBlock)
  const txsWithinCutoff = flushesWithinCutoff.map((l) => l.transactionHash)
  console.log(`Finalizing ${txsWithinCutoff.length} txs.`)

  for (const tx of txsWithinCutoff) {
    await finalizeMessage(tx)
  }
}
