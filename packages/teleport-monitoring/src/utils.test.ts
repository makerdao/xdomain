import { expect, mockFn } from 'earljs'

import { inChunks } from './utils'

describe('inChunks', () => {
  it('chunks simple case', async () => {
    const spy = mockFn<(from: number, to: number) => Promise<void>>()
    spy.resolvesTo()

    await inChunks(0, 2, 2, spy)

    expect(spy).toHaveBeenCalledExactlyWith([[0, 2]])
  })

  it('chunks edge case', async () => {
    const spy = mockFn<(from: number, to: number) => Promise<void>>()
    spy.resolvesTo()

    await inChunks(0, 0, 2, spy)

    expect(spy).toHaveBeenCalledExactlyWith([[0, 0]])
  })

  it('chunks prevents overflow', async () => {
    const spy = mockFn<(from: number, to: number) => Promise<void>>()
    spy.resolvesTo()

    await inChunks(0, 10, 3, spy)

    expect(spy).toHaveBeenCalledExactlyWith([
      [0, 3],
      [4, 7],
      [8, 10],
    ])
  })
})
