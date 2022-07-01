import { merge } from 'lodash'

import { BlockchainClient } from '../peripherals/blockchain'
import { SynchronizerStatusRepository } from '../peripherals/db/SynchronizerStatusRepository'
import { TxHandle } from '../peripherals/db/utils'
import { delay } from '../utils'

export interface SyncOptions {
  tipSyncDelay: number // ms
  safeDistanceFromTip: number
}

export const defaultSyncOptions: SyncOptions = {
  tipSyncDelay: 5_000,
  safeDistanceFromTip: 0,
}

export type SynchronizerState = 'stopped' | 'syncing' | 'synced'

export abstract class GenericSynchronizer {
  private readonly options: SyncOptions
  public readonly syncName: string

  constructor(
    private readonly blockchain: BlockchainClient,
    private readonly synchronizerStatusRepository: SynchronizerStatusRepository,
    public readonly domainName: string,
    public readonly startingBlock: number,
    public readonly blocksPerBatch: number,
    _options?: Partial<SyncOptions>,
  ) {
    this.syncName = this.constructor.name
    this.options = merge({}, defaultSyncOptions, _options)
  }

  private _state: SynchronizerState = 'stopped'
  get state(): SynchronizerState {
    return this._state
  }
  stop() {
    this._state = 'stopped'
  }
  private setSynced() {
    if (this.state === 'syncing') {
      this._state = 'synced'
    }
  }
  private setSyncing() {
    this._state = 'syncing'
  }

  /**
   * Note: this might end up syncing a tip for while before stopping.
   */
  async syncOnce(): Promise<void> {
    void this.run()
    while (this.state === 'syncing') {
      await delay(1000)
    }
    this.stop()
  }

  async run(): Promise<void> {
    this.setSyncing()
    const syncStatus = await this.synchronizerStatusRepository.findByName(this.syncName, this.domainName)
    let fromBlockNumber = syncStatus?.block ?? this.startingBlock // inclusive

    while (this.state !== 'stopped') {
      const currentBlock = (await this.blockchain.getLatestBlockNumber()) - this.options.safeDistanceFromTip
      const toBlockNumber = Math.min(fromBlockNumber + this.blocksPerBatch, currentBlock + 1) // exclusive

      if (fromBlockNumber !== toBlockNumber) {
        console.log(
          `[${this.syncName}] Syncing ${fromBlockNumber}...${toBlockNumber} (${(
            toBlockNumber - fromBlockNumber
          ).toLocaleString()} blocks)`,
        )

        const toCommit = await this.sync(fromBlockNumber, toBlockNumber)
        await this.synchronizerStatusRepository.transaction(async (tx) => {
          if (toCommit) {
            await toCommit(tx)
          }
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
        this.setSynced()
        await delay(this.options.tipSyncDelay)
      }
    }
  }

  // from inclusive
  // to exclusive
  abstract sync(from: number, to: number): Promise<((tx: TxHandle) => Promise<any>) | void>
}
