import { Settle } from '@prisma/client'
import { providers } from 'ethers/lib/ethers'
import { parseBytes32String } from 'ethers/lib/utils'

import { SettleRepository } from '../db/SettleRepository'
import { SynchronizerStatusRepository } from '../db/SynchronizerStatusRepository'
import { L1Sdk } from '../sdks'
import { delay } from '../utils'
import { BaseSynchronizer } from './BaseSynchronizer'

export class SettleEventsSynchronizer extends BaseSynchronizer {
  constructor(
    private readonly provider: providers.Provider,
    private readonly synchronizerStatusRepository: SynchronizerStatusRepository,
    private readonly settleRepository: SettleRepository,
    private readonly l1Sdk: L1Sdk,
    private readonly domainName: string,
    private readonly startingBlock: number,
    private readonly blocksPerBatch: number,
  ) {
    super()
  }

  async run(): Promise<void> {
    const syncStatus = await this.synchronizerStatusRepository.findByName(this.name, this.domainName)
    let syncBlock = syncStatus?.block ?? this.startingBlock - 1

    const filter = this.l1Sdk.join.filters.Settle()

    this._state = 'syncing'
    while (this.state !== 'stopped') {
      const currentBlock = (await this.provider.getBlock('latest')).number - 8 // always stay behind the blockchain HEAD to avoid reorgs
      const boundaryBlock = Math.min(syncBlock + this.blocksPerBatch, currentBlock)
      console.log(
        `[${this.name}] Syncing ${syncBlock}...${boundaryBlock} (${(
          boundaryBlock - syncBlock
        ).toLocaleString()} blocks)`,
      )

      // ranges are inclusive here so we + 1 to avoid checking the same block twice
      const newEvents = await this.l1Sdk.join.queryFilter(filter, syncBlock + 1, Math.max(boundaryBlock, syncBlock + 1))
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

      // update sync block
      await this.settleRepository.transaction(async (tx) => {
        await this.settleRepository.createMany(modelsToCreate, tx)
        await this.synchronizerStatusRepository.upsert(
          { domain: this.domainName, block: boundaryBlock, name: this.name },
          tx,
        )
      })

      syncBlock = boundaryBlock
      const onTip = boundaryBlock === currentBlock
      if (onTip) {
        console.log('Syncing tip. Stalling....')
        if (this.state === 'syncing') {
          this._state = 'synced'
        }
        await delay(5_000)
      }
    }
  }
}
