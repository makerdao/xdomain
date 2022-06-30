import { Teleport } from '@prisma/client'
import { BigNumber } from 'ethers/lib/ethers'
import { keccak256, parseBytes32String } from 'ethers/lib/utils'

import { BlockchainClient } from '../peripherals/blockchain'
import { SynchronizerStatusRepository } from '../peripherals/db/SynchronizerStatusRepository'
import { TeleportRepository } from '../peripherals/db/TeleportRepository'
import { TxHandle } from '../peripherals/db/utils'
import { L2Sdk } from '../sdks'
import { GenericSynchronizer } from './GenericSynchronizer'

export type OnChainTeleport = {
  sourceDomain: string
  targetDomain: string
  receiver: string
  operator: string
  amount: BigNumber
  nonce: BigNumber
  timestamp: number
}

export class InitEventsSynchronizer extends GenericSynchronizer {
  constructor(
    blockchain: BlockchainClient,
    synchronizerStatusRepository: SynchronizerStatusRepository,
    domainName: string,
    startingBlock: number,
    blocksPerBatch: number,
    private readonly teleportRepository: TeleportRepository,
    private readonly l2Sdk: L2Sdk,
  ) {
    super(blockchain, synchronizerStatusRepository, domainName, startingBlock, blocksPerBatch)
  }

  async sync(from: number, to: number) {
    const filter = this.l2Sdk.teleportGateway.filters.WormholeInitialized()

    const newTeleports = await this.l2Sdk.teleportGateway.queryFilter(filter, from, to - 1)
    console.log(`[${this.syncName}] Found ${newTeleports.length} new teleports`)

    const modelsToCreate: Omit<Teleport, 'id'>[] = newTeleports.map((w) => {
      const hash = keccak256(w.data)
      return {
        hash,
        sourceDomain: parseBytes32String(w.args[0].sourceDomain),
        targetDomain: parseBytes32String(w.args[0].targetDomain),
        amount: w.args[0].amount.toString(),
        nonce: w.args[0].nonce.toString(),
        operator: w.args[0].operator,
        receiver: w.args[0].receiver,
        timestamp: new Date(w.args[0].timestamp * 1000),
      }
    })

    return (tx: TxHandle) => this.teleportRepository.createMany(modelsToCreate, tx)
  }
}
