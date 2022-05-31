import { Teleport } from '@prisma/client'
import { BigNumber, providers } from 'ethers/lib/ethers'
import { keccak256 } from 'ethers/lib/utils'

import { SynchronizerStatusRepository } from '../db/SynchronizerStatusRepository'
import { TeleportRepository } from '../db/TeleportRepository'
import { L2Sdk } from '../sdks'
import { delay } from '../utils'
import { BaseSynchronizer } from './BaseSynchronizer'

export type OnChainTeleport = {
  sourceDomain: string
  targetDomain: string
  receiver: string
  operator: string
  amount: BigNumber
  nonce: BigNumber
  timestamp: number
}

export class InitEventsSynchronizer extends BaseSynchronizer {
  constructor(
    private readonly l2Provider: providers.Provider,
    private readonly synchronizerStatusRepository: SynchronizerStatusRepository,
    private readonly teleportRepository: TeleportRepository,
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

    const filter = this.l2Sdk.teleportGateway.filters.WormholeInitialized()

    this._state = 'syncing'
    while (this.state !== 'stopped') {
      const currentBlock = (await this.l2Provider.getBlock('latest')).number // note: getting block number directly doesnt work b/c optimism doesnt support it
      const boundaryBlock = Math.min(syncBlock + this.blocksPerBatch, currentBlock)
      console.log(`Syncing ${syncBlock}...${boundaryBlock} (${(boundaryBlock - syncBlock).toLocaleString()} blocks)`)

      const newTeleports = await this.l2Sdk.teleportGateway.queryFilter(filter, syncBlock, boundaryBlock)
      console.log(`[${this.name}] Found ${newTeleports.length} new teleports`)
      const modelsToCreate: Omit<Teleport, 'id'>[] = newTeleports.map((w) => {
        const hash = keccak256(w.data)
        return {
          hash,
          sourceDomain: w.args[0].sourceDomain,
          targetDomain: w.args[0].targetDomain,
          amount: w.args[0].amount.toString(),
          nonce: w.args[0].nonce.toString(),
          operator: w.args[0].operator,
          receiver: w.args[0].receiver,
          timestamp: new Date(w.args[0].timestamp * 1000),
        }
      })

      // update sync block
      await this.teleportRepository.transaction(async (tx) => {
        await this.teleportRepository.createMany(modelsToCreate, tx)
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
