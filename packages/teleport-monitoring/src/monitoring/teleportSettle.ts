import { formatBytes32String } from 'ethers/lib/utils'

import { SettleRepository } from '../peripherals/db/SettleRepository'
import { L1Sdk } from '../sdks'

export async function monitorTeleportSettle(
  l1Sdk: L1Sdk,
  settleRepository: SettleRepository,
  sourceDomain: string,
  targetDomain: string,
): Promise<{ sinceLastSettle: number; debtToSettle: string }> {
  const currentTimestamp = new Date().getTime()
  const lastSettle = await settleRepository.findLatest(sourceDomain, targetDomain)

  return {
    sinceLastSettle: lastSettle ? currentTimestamp - lastSettle.timestamp.getTime() : +Infinity,
    debtToSettle: (await l1Sdk.join.debt(formatBytes32String(sourceDomain))).toString(),
  }
}
