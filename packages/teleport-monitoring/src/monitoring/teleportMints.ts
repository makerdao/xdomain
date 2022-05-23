import { PrismaClient } from '@prisma/client'
import { BigNumber } from 'ethers'

import { L1Sdk } from '../sdks'

export async function monitorTeleportMints(blockNumber: number, l1Sdk: L1Sdk, prisma: PrismaClient) {
  const filter = l1Sdk.join.filters.Mint()
  const mints = await l1Sdk.join.queryFilter(filter, blockNumber, blockNumber)
  const oracleMints = mints.filter((m) => m.args.originator === l1Sdk.oracleAuth.address)

  let badDebt: BigNumber = BigNumber.from(0)
  for (const mint of oracleMints) {
    const hash = mint.args.hashGUID

    if (!(await prisma.teleport.findUnique({ where: { hash: hash } }))) {
      badDebt = badDebt.add(mint.args.amount)
      console.warn('Detected uncollateralized teleport ', mint.args)
    }
  }

  return badDebt
}
