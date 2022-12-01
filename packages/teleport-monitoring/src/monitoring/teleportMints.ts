import { BigNumber } from 'ethers'

import { TeleportRepository } from '../peripherals/db/TeleportRepository'
import { L1Sdk } from '../sdks'

export async function monitorTeleportMints(
  l1Sdk: L1Sdk,
  teleportRepository: TeleportRepository,
  sourceDomains: Array<string>,
  startBlockNumber: number,
  lastBlockNumber?: number,
) {
  const filter = l1Sdk.join.filters.Mint()
  const mints = await l1Sdk.join.queryFilter(filter, startBlockNumber, lastBlockNumber ?? startBlockNumber)
  // ignore mints not originating from the oracleAuth or mints originating from source domains that are not monitored (e.g. Starknet)
  const oracleMints = mints.filter(
    (m) => m.args.originator === l1Sdk.oracleAuth.address && sourceDomains.includes(m.args.teleportGUID.sourceDomain),
  )

  let badDebt: BigNumber = BigNumber.from(0)
  for (const mint of oracleMints) {
    const hash = mint.args.hashGUID

    if (!(await teleportRepository.findByHash(hash))) {
      badDebt = badDebt.add(mint.args.amount)
      console.warn('Detected uncollateralized teleport ', mint.args)
    }
  }

  return badDebt
}
