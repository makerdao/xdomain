import { PrismaClient } from '@prisma/client'
import { ethers, providers } from 'ethers'

import { idsToChains, networks } from '../config'
import { FlushRepository } from '../peripherals/db/FlushRepository'
import { SettleRepository } from '../peripherals/db/SettleRepository'
import { SynchronizerStatusRepository } from '../peripherals/db/SynchronizerStatusRepository'
import { TeleportRepository } from '../peripherals/db/TeleportRepository'
import { NetworkConfig } from '../types'

type InitFunction = (args: {
  network: NetworkConfig
  l1Provider: providers.Provider
  teleportRepository: TeleportRepository
  flushRepository: FlushRepository
  synchronizerStatusRepository: SynchronizerStatusRepository
  settleRepository: SettleRepository
}) => Promise<void>

interface Slave {
  name: string
  l2Rpc: string
  sdkName: string
  bridgeDeploymentBlock: number
  syncBatchSize: number
}

export async function run(fn: InitFunction): Promise<void> {
  try {
    const l1Rpc = process.argv[2] || process.env['L1_RPC']
    const cfgString = process.argv[3] || process.env['CONFIG']
    const cfg = (cfgString && JSON.parse(cfgString)) || {}

    if (!l1Rpc) {
      throw new Error('L1 RPC not found. Pass it as first argument or as L1_RPC env variable.')
    }

    const l1Provider = new ethers.providers.JsonRpcProvider(l1Rpc)

    const chainId = (await l1Provider.getNetwork()).chainId
    const networkName = idsToChains[chainId]
    const defaultNetwork = networks[chainId]

    if (!networkName || !defaultNetwork) {
      throw new Error(`Can't find config for network with id: ${chainId}`)
    }

    const network = { ...defaultNetwork, ...cfg }
    network.slaves = defaultNetwork.slaves.map((slave) => ({
      ...slave,
      ...cfg.slaves?.find((s: Slave) => s.name === slave.name),
    }))

    const prisma = new PrismaClient()
    await prisma.$connect()

    console.log(`Loaded config for ${networkName}`)

    const teleportRepository = new TeleportRepository(prisma)
    const flushRepository = new FlushRepository(prisma)
    const synchronizerStatusRepository = new SynchronizerStatusRepository(prisma)
    const settleRepository = new SettleRepository(prisma)

    await fn({
      l1Provider,
      network,
      synchronizerStatusRepository,
      teleportRepository,
      flushRepository,
      settleRepository,
    })
  } catch (e) {
    console.error('Error occured: ', e)
    process.exit(1)
  }
}
