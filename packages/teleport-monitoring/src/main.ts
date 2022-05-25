import { PrismaClient } from '@prisma/client'
import { ethers } from 'ethers'

import { idsToChains, networks } from './config'
import { SyncStatusRepository } from './db/SyncStatusRepository'
import { TeleportRepository } from './db/TeleportRepository'
import { monitor } from './monitor'
import { startServer } from './server'

export async function main(l1Rpc: string) {
  const l1Provider = new ethers.providers.JsonRpcProvider(l1Rpc)

  const chainId = (await l1Provider.getNetwork()).chainId
  const networkName = idsToChains[chainId]
  const network = networks[chainId]

  if (!networkName || !network) {
    throw new Error(`Can't find config for network with id: ${chainId}`)
  }

  const prisma = new PrismaClient()
  await prisma.$connect()

  console.log(`Loaded config for ${networkName}`)

  const teleportRepository = new TeleportRepository(prisma)
  const syncStatusRepository = new SyncStatusRepository(prisma)

  const { metrics } = await monitor(network, l1Provider, teleportRepository, syncStatusRepository)

  await Promise.all([startServer(metrics)])
}
