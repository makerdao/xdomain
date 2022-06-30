import { BigNumber } from 'ethers'

import { TeleportRepository } from '../peripherals/db/TeleportRepository'
import { L1Sdk } from '../sdks'

export async function monitorTeleportMints(
  l1Sdk: L1Sdk,
  teleportRepository: TeleportRepository,
  startBlockNumber: number,
  lastBlockNumber?: number,
) {
  const filter = l1Sdk.join.filters.Mint()
  const mints = await l1Sdk.join.queryFilter(filter, startBlockNumber, lastBlockNumber ?? startBlockNumber)
  const oracleMints = mints.filter((m) => m.args.originator === l1Sdk.oracleAuth.address)

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
