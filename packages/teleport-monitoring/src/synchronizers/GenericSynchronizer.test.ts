import { expect, Mock, mockFn } from 'earljs'
import waitForExpect from 'wait-for-expect'

import { setupDatabaseTestSuite } from '../../test-e2e/database'
import { BlockchainClient } from '../peripherals/blockchain'
import { SynchronizerStatusRepository } from '../peripherals/db/SynchronizerStatusRepository'
import { delay } from '../utils'
import { GenericSynchronizer } from './GenericSynchronizer'

class TestSynchronizer extends GenericSynchronizer {
  async sync(_from: number, _to: number): Promise<void> {}
}

const domainName = 'local'
const blocksPerBatch = 2
const synchronizerName = TestSynchronizer.name

describe(GenericSynchronizer.name, () => {
  const prisma = setupDatabaseTestSuite()

  it('syncs past correctly', async () => {
    const startingBlock = 1
    const currentBlock = 5
    const synchronizerStatusRepository = new SynchronizerStatusRepository(prisma)
    const blockchainMock: BlockchainClient = {
      getLatestBlockNumber: mockFn().resolvesTo(currentBlock),
    }
    const syncFn = mockFn<TestSynchronizer['sync']>().resolvesTo(undefined)
    const genericSynchronizer = new TestSynchronizer(
      blockchainMock,
      synchronizerStatusRepository,
      domainName,
      startingBlock,
      blocksPerBatch,
    )
    genericSynchronizer.sync = syncFn

    await genericSynchronizer.syncOnce()

    expect(syncFn).toHaveBeenCalledExactlyWith([
      [1, 3],
      [3, 5],
      [5, 6],
    ])
    expect(await synchronizerStatusRepository.findByName(synchronizerName, domainName)).toEqual(
      expect.objectWith({ block: currentBlock + 1 }),
    )
  })

  it('syncs tip', async () => {
    const startingBlock = 1
    const currentBlock = 1
    const synchronizerStatusRepository = new SynchronizerStatusRepository(prisma)
    const blockchainMock: BlockchainClient = {
      getLatestBlockNumber: mockFn()
        .resolvesToOnce(currentBlock)
        .resolvesToOnce(currentBlock + 1)
        .resolvesToOnce(currentBlock + 2)
        // later return the same block
        // @todo: this could be simplified with https://github.com/dethcrypto/earl/issues/199
        .resolvesToOnce(currentBlock + 3)
        .resolvesToOnce(currentBlock + 3)
        .resolvesToOnce(currentBlock + 3)
        .resolvesToOnce(currentBlock + 3)
        .resolvesToOnce(currentBlock + 3)
        .resolvesToOnce(currentBlock + 3)
        .resolvesToOnce(currentBlock + 3),
    }
    const syncFn = mockFn<TestSynchronizer['sync']>().resolvesTo(undefined)
    const genericSynchronizer = new TestSynchronizer(
      blockchainMock,
      synchronizerStatusRepository,
      domainName,
      startingBlock,
      blocksPerBatch,
      { tipSyncDelay: 1000 },
    )
    genericSynchronizer.sync = syncFn

    void genericSynchronizer.run()

    await waitForExpect(() =>
      expect(syncFn).toHaveBeenCalledExactlyWith([
        [1, 2],
        [2, 3],
        [3, 4],
        [4, 5],
      ]),
    )
    expect(await synchronizerStatusRepository.findByName(synchronizerName, domainName)).toEqual(
      expect.objectWith({ block: 5 }),
    )

    await delay(2000)
    expect(syncFn).toHaveBeenCalledExactlyWith([
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
    ])
    genericSynchronizer.stop()
  })

  it('restarts after being done from the last block', async () => {
    const startingBlock = 1
    const currentBlock = 1
    const synchronizerStatusRepository = new SynchronizerStatusRepository(prisma)
    const blockchainMock: BlockchainClient = {
      getLatestBlockNumber: mockFn()
        .resolvesToOnce(currentBlock)
        .resolvesToOnce(currentBlock + 1)
        .resolvesToOnce(currentBlock + 2)
        // later return the same block
        // @todo: this could be simplified with https://github.com/dethcrypto/earl/issues/199
        .resolvesToOnce(currentBlock + 3)
        .resolvesToOnce(currentBlock + 3)
        .resolvesToOnce(currentBlock + 3)
        .resolvesToOnce(currentBlock + 3)
        .resolvesToOnce(currentBlock + 3)
        .resolvesToOnce(currentBlock + 3)
        .resolvesToOnce(currentBlock + 3),
    }
    const syncFn = mockFn<TestSynchronizer['sync']>().resolvesTo(undefined)
    const genericSynchronizer = new TestSynchronizer(
      blockchainMock,
      synchronizerStatusRepository,
      domainName,
      startingBlock,
      blocksPerBatch,
      { tipSyncDelay: 1000 },
    )
    genericSynchronizer.sync = syncFn

    const syncedPromise = genericSynchronizer.run()

    await waitForExpect(async () => {
      expect(syncFn).toHaveBeenCalledExactlyWith([
        [1, 2],
        [2, 3],
        [3, 4],
        [4, 5],
      ])
      expect(await synchronizerStatusRepository.findByName(synchronizerName, domainName)).toEqual(
        expect.objectWith({ block: 5 }),
      )
    })
    genericSynchronizer.stop()
    await syncedPromise
    ;(blockchainMock.getLatestBlockNumber as Mock<any, any>).returns(5)
    void genericSynchronizer.run()

    await waitForExpect(() => {
      expect(syncFn).toHaveBeenCalledExactlyWith([
        [1, 2],
        [2, 3],
        [3, 4],
        [4, 5],
        [5, 6],
      ])
    })
    genericSynchronizer.stop()
    await waitForExpect(async () => {
      expect(await synchronizerStatusRepository.findByName(synchronizerName, domainName)).toEqual(
        expect.objectWith({ block: 6 }),
      )
    })
  })

  it('syncs with artificial delay', async () => {
    const startingBlock = 1
    const currentBlock = 15
    const safeDistanceFromTip = 10
    const synchronizerStatusRepository = new SynchronizerStatusRepository(prisma)
    const blockchainMock: BlockchainClient = {
      getLatestBlockNumber: mockFn().resolvesTo(currentBlock),
    }
    const syncFn = mockFn<TestSynchronizer['sync']>().resolvesTo(undefined)
    const genericSynchronizer = new TestSynchronizer(
      blockchainMock,
      synchronizerStatusRepository,
      domainName,
      startingBlock,
      blocksPerBatch,
      { safeDistanceFromTip },
    )
    genericSynchronizer.sync = syncFn

    await genericSynchronizer.syncOnce()

    expect(syncFn).toHaveBeenCalledExactlyWith([
      [1, 3],
      [3, 5],
      [5, 6],
    ])
    expect(await synchronizerStatusRepository.findByName(synchronizerName, domainName)).toEqual(
      expect.objectWith({ block: currentBlock + 1 - safeDistanceFromTip }),
    )
  })
})
