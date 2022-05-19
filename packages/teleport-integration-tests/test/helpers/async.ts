export function delay(duration: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, duration))
}

export async function retry<T>(fn: () => Promise<T>, maxRetries: number = 5): Promise<T> {
  const sleepBetweenRetries = 1000
  let retryCount = 0

  do {
    try {
      return await fn()
    } catch (error) {
      const isLastAttempt = retryCount === maxRetries
      if (isLastAttempt) {
        throw error
      }
      console.log('retry...')
    }
    await delay(sleepBetweenRetries)
  } while (retryCount++ < maxRetries)

  throw new Error('Unreachable')
}
