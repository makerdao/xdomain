import { formatBytes32String } from 'ethers/lib/utils'

import { FlushRepository } from '../peripherals/db/FlushRepository'
import { L2Sdk } from '../sdks'

export async function monitorTeleportFlush(
  l2Sdk: L2Sdk,
  flushRepository: FlushRepository,
  sourceDomain: string,
  targetDomain: string,
): Promise<{ sinceLastFlush: number; debtToFlush: string }> {
  const currentTimestamp = new Date().getTime()
  const lastFlush = await flushRepository.findLatest(sourceDomain, targetDomain)

  return {
    sinceLastFlush: lastFlush ? currentTimestamp - lastFlush.timestamp.getTime() : +Infinity,
    debtToFlush: (await l2Sdk.teleportGateway.batchedDaiToFlush(formatBytes32String(targetDomain))).toString(),
  }
}
