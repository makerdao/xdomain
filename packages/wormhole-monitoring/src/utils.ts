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
