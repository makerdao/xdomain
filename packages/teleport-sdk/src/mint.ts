import { Provider } from '@ethersproject/abstract-provider'

import { DomainId, getGuidHash, getSdk, sleep, TeleportGUID } from '.'

const DEFAULT_POLLING_INTERVAL_MS = 2000

export async function waitForMintConfirmation(
  srcDomain: DomainId,
  dstDomain: DomainId,
  dstDomainProvider: Provider,
  teleportGUIDorGUIDHash: TeleportGUID | string,
  pollingIntervalMs?: number,
  timeoutMs?: number,
): Promise<string> {
  const interval = pollingIntervalMs || DEFAULT_POLLING_INTERVAL_MS

  const sdk = getSdk(dstDomain, dstDomainProvider)
  const join = sdk.TeleportJoin!
  const guidHash =
    typeof teleportGUIDorGUIDHash === 'string' ? teleportGUIDorGUIDHash : getGuidHash(teleportGUIDorGUIDHash)

  let timeSlept = 0

  const sleepOrTimeout = async () => {
    if (timeoutMs !== undefined && timeSlept >= timeoutMs) {
      const errorMsg = `Mint event could not be found within ${timeoutMs}ms for guidHash=${guidHash}.`
      const [, pending] = await join.teleports(guidHash)
      if (pending.eq(0)) {
        throw new Error(`Mint confirmed but ${errorMsg}`)
      }
      throw new Error(errorMsg)
    }
    await sleep(interval)
    timeSlept += interval
  }

  let events: Array<any> = []
  while (true) {
    events = await join.queryFilter(join.filters.Mint(guidHash))
    if (events[0]) return events[0].transactionHash
    await sleepOrTimeout()
  }
}
