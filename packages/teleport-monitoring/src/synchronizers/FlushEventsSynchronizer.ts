import { Flush } from '@prisma/client'
import { providers } from 'ethers/lib/ethers'
import { parseBytes32String } from 'ethers/lib/utils'

import { FlushRepository } from '../db/FlushRepository'
import { SynchronizerStatusRepository } from '../db/SynchronizerStatusRepository'
import { L2Sdk } from '../sdks'
import { delay } from '../utils'
import { BaseSynchronizer } from './BaseSynchronizer'

export class FlushEventsSynchronizer extends BaseSynchronizer {
  constructor(
    private readonly l2Provider: providers.Provider,
    private readonly synchronizerStatusRepository: SynchronizerStatusRepository,
    private readonly flushRepository: FlushRepository,
    private readonly l2Sdk: L2Sdk,
    private readonly domainName: string,
    private readonly startingBlock: number,
    private readonly blocksPerBatch: number,
  ) {
    super()
  }

  async run(): Promise<void> {
    const syncStatus = await this.synchronizerStatusRepository.findByName(this.name, this.domainName)
    let syncBlock = syncStatus?.block ?? this.startingBlock

    const filter = this.l2Sdk.teleportGateway.filters.Flushed()

    this._state = 'syncing'
    while (this.state !== 'stopped') {
      const currentBlock = (await this.l2Provider.getBlock('latest')).number // note: getting block number directly doesnt work b/c optimism doesnt support it
      const boundaryBlock = Math.min(syncBlock + this.blocksPerBatch, currentBlock)
      console.log(
        `[${this.name}] Syncing ${syncBlock}...${boundaryBlock} (${(
          boundaryBlock - syncBlock
        ).toLocaleString()} blocks)`,
      )

      const newFlushes = await this.l2Sdk.teleportGateway.queryFilter(filter, syncBlock, boundaryBlock)
      console.log(`Found ${newFlushes.length} new flushes`)
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

      // update sync block
      await this.flushRepository.transaction(async (tx) => {
        await this.flushRepository.createMany(modelsToCreate, tx)
        await this.synchronizerStatusRepository.upsert(
          { domain: this.domainName, block: boundaryBlock, name: this.name },
          tx,
        )
      })

      syncBlock = boundaryBlock
      const onTip = boundaryBlock === currentBlock
      if (onTip) {
        console.log('Syncing tip. Stalling....')
        this._state = 'synced'
        await delay(5_000)
      }
    }
  }
}
