import { Flush } from '@prisma/client'
import { parseBytes32String } from 'ethers/lib/utils'

import { BlockchainClient } from '../peripherals/blockchain'
import { FlushRepository } from '../peripherals/db/FlushRepository'
import { SynchronizerStatusRepository } from '../peripherals/db/SynchronizerStatusRepository'
import { TxHandle } from '../peripherals/db/utils'
import { L2Sdk } from '../sdks'
import { GenericSynchronizer } from './GenericSynchronizer'

export class FlushEventsSynchronizer extends GenericSynchronizer {
  constructor(
    blockchain: BlockchainClient,
    synchronizerStatusRepository: SynchronizerStatusRepository,
    domainName: string,
    startingBlock: number,
    blocksPerBatch: number,
    private readonly flushRepository: FlushRepository,
    private readonly l2Sdk: L2Sdk,
  ) {
    super(blockchain, synchronizerStatusRepository, domainName, startingBlock, blocksPerBatch)
  }

  async sync(from: number, to: number) {
    const filter = this.l2Sdk.teleportGateway.filters.Flushed()

    const newFlushes = await this.l2Sdk.teleportGateway.queryFilter(filter, from, to - 1)
    console.log(`[${this.syncName}] Found ${newFlushes.length} new flushes`)

    const modelsToCreate: Omit<Flush, 'id'>[] = await Promise.all(
      newFlushes.map(async (w) => {
        return {
          sourceDomain: this.domainName,
          targetDomain: parseBytes32String(w.args.targetDomain),
          amount: w.args.dai.toString(),
          timestamp: new Date((await w.getBlock()).timestamp * 1000),
        }
      }),
    )

    return (tx: TxHandle) => this.flushRepository.createMany(modelsToCreate, tx)
  }
}
