import { expect, mockFn } from 'earljs'

import { inChunks, makeMetricName } from './utils'

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

describe(makeMetricName.name, () => {
  it('makes a metric name without any labels', () => {
    expect(makeMetricName('cpu_usage', {})).toEqual('cpu_usage')
  })

  it('makes a metric name with 1 label', () => {
    expect(makeMetricName('cpu_usage', { location: 'FRA' })).toEqual('cpu_usage{location="FRA"}')
  })

  it('makes a metric name with multiple labels', () => {
    expect(makeMetricName('cpu_usage', { location: 'FRA', arch: 'amd64' })).toEqual(
      'cpu_usage{location="FRA",arch="amd64"}',
    )
  })
})
