export async function setIntervalAsync(fn: () => Promise<void>, gap: number): Promise<never> {
  while (true) {
    await fn()
    await delay(gap)
  }
}

export async function delay(timeout: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout)
  })
}
