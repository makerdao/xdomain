import { merge } from 'lodash'

import { SynchronizerStatusRepository } from '../db/SynchronizerStatusRepository'
import { TxHandle } from '../db/utils'
import { delay } from '../utils'
import { BaseSynchronizer } from './BaseSynchronizer'

export interface Blockchain {
  getLatestBlockNumber(): Promise<number>
}

export type SyncFn = (tx: TxHandle, from: number, to: number) => Promise<void>

export interface SyncOptions {
  tipSyncDelay: number // ms
  saveDistanceFromTip: number
}

export const defaultSyncOptions: SyncOptions = {
  tipSyncDelay: 5_000,
  saveDistanceFromTip: 0,
}

export class GenericSynchronizer extends BaseSynchronizer {
  private readonly options: SyncOptions
  constructor(
    private readonly blockchain: Blockchain,
    private readonly synchronizerStatusRepository: SynchronizerStatusRepository,
    private readonly domainName: string,
    private readonly startingBlock: number,
    private readonly blocksPerBatch: number,
    private readonly syncName: string,
    // from inclusive
    // to exclusive
    private readonly syncFn: SyncFn,
    _options?: Partial<SyncOptions>,
  ) {
    super()
    this.options = merge({}, defaultSyncOptions, _options)
  }

  async run(): Promise<void> {
    super.setSyncing()
    const syncStatus = await this.synchronizerStatusRepository.findByName(this.syncName, this.domainName)
    let fromBlockNumber = syncStatus?.block ?? this.startingBlock // inclusive

    while (this.state !== 'stopped') {
      const currentBlock = (await this.blockchain.getLatestBlockNumber()) - this.options.saveDistanceFromTip
      const toBlockNumber = Math.min(fromBlockNumber + this.blocksPerBatch, currentBlock + 1) // exclusive

      if (fromBlockNumber !== toBlockNumber) {
        console.log(
          `[${this.name}] Syncing ${fromBlockNumber}...${toBlockNumber} (${(
            toBlockNumber - fromBlockNumber
          ).toLocaleString()} blocks)`,
        )

        await this.synchronizerStatusRepository.transaction(async (tx) => {
          await this.syncFn(tx, fromBlockNumber, toBlockNumber)
          await this.synchronizerStatusRepository.upsert(
            { domain: this.domainName, block: toBlockNumber, name: this.syncName },
            tx,
          )
        })
      }

      fromBlockNumber = toBlockNumber
      const onTip = toBlockNumber === currentBlock + 1
      if (onTip) {
        console.log('Syncing tip. Stalling....')
        super.setSynced()
        await delay(this.options.tipSyncDelay)
      }
    }
  }
}

// const filter = this.l1Sdk.join.filters.Settle()
//       // ranges are inclusive here so we + 1 to avoid checking the same block twice
//       const newEvents = await this.l1Sdk.join.queryFilter(filter, syncBlock + 1, Math.max(boundaryBlock, syncBlock + 1))
//       console.log(`Found ${newEvents.length} new settles`)
//       const modelsToCreate: Omit<Settle, 'id'>[] = await Promise.all(
//         newEvents.map(async (w) => {
//           return {
//             sourceDomain: parseBytes32String(w.args.sourceDomain),
//             targetDomain: this.domainName,
//             amount: w.args.batchedDaiToFlush.toString(),
//             timestamp: new Date((await w.getBlock()).timestamp * 1000),
//           }
//         }),
//       )
