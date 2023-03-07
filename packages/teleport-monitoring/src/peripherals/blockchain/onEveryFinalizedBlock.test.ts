import { Block } from '@ethersproject/abstract-provider'
import FakeTimers from '@sinonjs/fake-timers'
import { expect, mockFn } from 'earljs'

import { onEveryFinalizedBlock } from './onEveryFinalizedBlock'

describe('onEveryFinalizedBlock', () => {
  it('calls when blocks are sequential', async () => {
    const clock = FakeTimers.install()

    const onBlock = mockFn<(blockNumber: number) => Promise<void>>(async () => {})
    const getBlockMock = mockFn<() => Block>()
      .returnsOnce({ number: 5 } as any)
      .returnsOnce({ number: 6 } as any)
      .returnsOnce({ number: 7 } as any)
      .returnsOnce({ number: 8 } as any)
    const mockProvider = {
      getBlock: getBlockMock,
    }

    const { cancel } = await onEveryFinalizedBlock(onBlock, mockProvider as any)

    await clock.tickAsync(2000)
    expect(onBlock).toHaveBeenCalledExactlyWith([[1], [2], [3]])

    cancel()
    clock.uninstall()
  })

  it('calls when blocks are not sequential', async () => {
    const clock = FakeTimers.install()

    const onBlock = mockFn<(blockNumber: number) => Promise<void>>(async () => {})
    const getBlockMock = mockFn<() => Block>()
      .returnsOnce({ number: 5 } as any)
      .returnsOnce({ number: 6 } as any)
      .returnsOnce({ number: 7 } as any)
      .returnsOnce({ number: 10 } as any) // notice fast mined block
    const mockProvider = {
      getBlock: getBlockMock,
    }

    const { cancel } = await onEveryFinalizedBlock(onBlock, mockProvider as any)

    await clock.tickAsync(2000)
    expect(onBlock).toHaveBeenCalledExactlyWith([[1], [2], [3], [4], [5]])

    cancel()
    clock.uninstall()
  })
})
