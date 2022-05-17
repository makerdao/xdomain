import { BigNumber } from 'ethers'

import { L1Sdk } from '../types'
import { Wormhole } from './wormhole-inits'

export async function monitorWormholeMints(wormholes: { [hash: string]: Wormhole }, blockNumber: number, l1Sdk: L1Sdk) {
  const filter = l1Sdk.join.filters.Mint()
  const mints = await l1Sdk.join.queryFilter(filter, blockNumber, blockNumber)
  const oracleMints = mints.filter((m) => m.args.originator === l1Sdk.oracleAuth.address)

  let badDebt: BigNumber = BigNumber.from(0)
  for (const mint of oracleMints) {
    const hash = mint.args.hashGUID

    if (!wormholes[hash]) {
      badDebt = badDebt.add(mint.args.amount)
      console.warn('Detected uncolatterized wormhole ', mint.args)
    }
  }

  return badDebt
}
