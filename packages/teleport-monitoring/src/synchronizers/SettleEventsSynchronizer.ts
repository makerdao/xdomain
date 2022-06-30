import { Settle } from '@prisma/client'
import { parseBytes32String } from 'ethers/lib/utils'

import { BlockchainClient } from '../peripherals/blockchain'
import { SettleRepository } from '../peripherals/db/SettleRepository'
import { SynchronizerStatusRepository } from '../peripherals/db/SynchronizerStatusRepository'
import { TxHandle } from '../peripherals/db/utils'
import { L1Sdk } from '../sdks'
import { GenericSynchronizer } from './GenericSynchronizer'

const MAX_REORG_DEPTH_FOR_MAINNET = 8

export class SettleEventsSynchronizer extends GenericSynchronizer {
  constructor(
    blockchain: BlockchainClient,
    synchronizerStatusRepository: SynchronizerStatusRepository,
    domainName: string,
    startingBlock: number,
    blocksPerBatch: number,
    private readonly settleRepository: SettleRepository,
    private readonly l1Sdk: L1Sdk,
  ) {
    super(blockchain, synchronizerStatusRepository, domainName, startingBlock, blocksPerBatch, {
      safeDistanceFromTip: MAX_REORG_DEPTH_FOR_MAINNET,
    })
  }

  async sync(from: number, to: number) {
    const filter = this.l1Sdk.join.filters.Settle()

    const newEvents = await this.l1Sdk.join.queryFilter(filter, from, to - 1)
    console.log(`Found ${newEvents.length} new settles`)

    const modelsToCreate: Omit<Settle, 'id'>[] = await Promise.all(
      newEvents.map(async (w) => {
        return {
          sourceDomain: parseBytes32String(w.args.sourceDomain),
          targetDomain: this.domainName,
          amount: w.args.batchedDaiToFlush.toString(),
          timestamp: new Date((await w.getBlock()).timestamp * 1000),
        }
      }),
    )
    return (tx: TxHandle) => this.settleRepository.createMany(modelsToCreate, tx)
  }
}
