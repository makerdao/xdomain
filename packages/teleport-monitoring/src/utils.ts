export function setIntervalAsync(fn: () => Promise<void>, gap: number): { cancel: () => void } {
  let cancelled = false
  setTimeout(async () => {
    // eslint-disable-next-line
    while (!cancelled) {
      await fn()
      await delay(gap)
    }
  })

  return {
    cancel: () => {
      cancelled = true
    },
  }
}

export async function delay(timeout: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout)
  })
}

// from & to inclusive
export async function inChunks(
  from: number,
  to: number,
  delta: number,
  fn: (from: number, to: number) => Promise<void>, // from & to inclusive
) {
  for (let i = from; i <= to; i += delta + 1) {
    await fn(Math.min(i, to), Math.min(i + delta, to))
  }
}
