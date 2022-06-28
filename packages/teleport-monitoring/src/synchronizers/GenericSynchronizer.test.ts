import { expect, Mock, mockFn } from 'earljs'
import waitForExpect from 'wait-for-expect'

import { setupDatabaseTestSuite } from '../../test-e2e/database'
import { SynchronizerStatusRepository } from '../db/SynchronizerStatusRepository'
import { delay } from '../utils'
import { Blockchain, GenericSynchronizer, SyncFn } from './GenericSynchronizer'

const domainName = 'local'
const synchronizerName = 'test'
const blocksPerBatch = 2

describe.only(GenericSynchronizer.name, () => {
  const prisma = setupDatabaseTestSuite()

  it('syncs past correctly', async () => {
    const startingBlock = 1
    const currentBlock = 5
    const synchronizerStatusRepository = new SynchronizerStatusRepository(prisma)
    const blockchainMock: Blockchain = {
      getLatestBlockNumber: mockFn().resolvesTo(currentBlock),
    }
    const syncFn = mockFn<SyncFn>().resolvesTo(undefined)
    const genericSynchronizer = new GenericSynchronizer(
      blockchainMock,
      synchronizerStatusRepository,
      domainName,
      startingBlock,
      blocksPerBatch,
      synchronizerName,
      syncFn,
    )

    await genericSynchronizer.syncOnce()

    // this is workaround for https://github.com/dethcrypto/earl/issues/200
    expect(syncFn.calls.map((p) => p.args.slice(1))).toEqual([
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
    const blockchainMock: Blockchain = {
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
    const syncFn = mockFn<SyncFn>().resolvesTo(undefined)
    const genericSynchronizer = new GenericSynchronizer(
      blockchainMock,
      synchronizerStatusRepository,
      domainName,
      startingBlock,
      blocksPerBatch,
      synchronizerName,
      syncFn,
      { tipSyncDelay: 1000 },
    )

    void genericSynchronizer.run()

    await waitForExpect(() =>
      expect(syncFn.calls.map((p) => p.args.slice(1))).toEqual([
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
    expect(syncFn.calls.map((p) => p.args.slice(1))).toEqual([
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
    const blockchainMock: Blockchain = {
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
    const syncFn = mockFn<SyncFn>().resolvesTo(undefined)
    const genericSynchronizer = new GenericSynchronizer(
      blockchainMock,
      synchronizerStatusRepository,
      domainName,
      startingBlock,
      blocksPerBatch,
      synchronizerName,
      syncFn,
      { tipSyncDelay: 1000 },
    )

    void genericSynchronizer.run()

    await waitForExpect(() =>
      expect(syncFn.calls.map((p) => p.args.slice(1))).toEqual([
        [1, 2],
        [2, 3],
        [3, 4],
        [4, 5],
      ]),
    )
    genericSynchronizer.stop()
    expect(await synchronizerStatusRepository.findByName(synchronizerName, domainName)).toEqual(
      expect.objectWith({ block: 5 }),
    )
    ;(blockchainMock.getLatestBlockNumber as Mock<any, any>).returns(5)
    void genericSynchronizer.run()

    await waitForExpect(() => {
      expect(syncFn.calls.map((p) => p.args.slice(1))).toEqual([
        [1, 2],
        [2, 3],
        [3, 4],
        [4, 5],
        [5, 6],
      ])
    })
    genericSynchronizer.stop()
    expect(await synchronizerStatusRepository.findByName(synchronizerName, domainName)).toEqual(
      expect.objectWith({ block: 6 }),
    )
  })

  it('syncs with artificial delay', async () => {
    const startingBlock = 1
    const currentBlock = 15
    const saveDistanceFromTip = 10
    const synchronizerStatusRepository = new SynchronizerStatusRepository(prisma)
    const blockchainMock: Blockchain = {
      getLatestBlockNumber: mockFn().resolvesTo(currentBlock),
    }
    const syncFn = mockFn<SyncFn>().resolvesTo(undefined)
    const genericSynchronizer = new GenericSynchronizer(
      blockchainMock,
      synchronizerStatusRepository,
      domainName,
      startingBlock,
      blocksPerBatch,
      synchronizerName,
      syncFn,
      { saveDistanceFromTip },
    )

    await genericSynchronizer.syncOnce()

    // this is workaround for https://github.com/dethcrypto/earl/issues/200
    expect(syncFn.calls.map((p) => p.args.slice(1))).toEqual([
      [1, 3],
      [3, 5],
      [5, 6],
    ])
    expect(await synchronizerStatusRepository.findByName(synchronizerName, domainName)).toEqual(
      expect.objectWith({ block: currentBlock + 1 - saveDistanceFromTip }),
    )
  })
})
